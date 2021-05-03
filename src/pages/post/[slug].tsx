/* eslint-disable react/no-danger */
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { RichText } from 'prismic-dom';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { v4 } from 'uuid';
import { format } from 'date-fns';
import Link from 'next/link';
import Head from 'next/head';
import Prismic from '@prismicio/client';
import ptBR from 'date-fns/locale/pt-BR';

import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  last_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
  prevpost?: any;
  nextpost?: any;
  preview: boolean;
}

export const UtterancesComments: React.FC = () => {
  return (
    <section
      id="utteranc-comments"
      className={styles.post}
      style={{ marginBottom: '64px' }}
      ref={elem => {
        if (!elem || elem.childNodes.length) return;

        const scriptElem = document.createElement('script');

        scriptElem.src = 'https://utteranc.es/client.js';
        scriptElem.async = true;
        scriptElem.crossOrigin = 'anonymous';
        scriptElem.setAttribute(
          'repo',
          'BrunoFutema/ignite-desafio06-trilha-reactjs'
        );
        scriptElem.setAttribute('issue-term', 'pathname');
        scriptElem.setAttribute('label', 'blog-comment');
        scriptElem.setAttribute('theme', 'github-dark');

        elem.appendChild(scriptElem);
      }}
    />
  );
};

export default function Post({
  post,
  prevpost,
  nextpost,
  preview,
}: PostProps): JSX.Element {
  const { isFallback } = useRouter();

  if (isFallback) {
    return <p>Carregando...</p>;
  }

  const mean = post.data.content.reduce((acc, content) => {
    const headingWords = content.heading.split(' ');

    const bodyWordsAmount = content.body.reduce((bodyAcc, bodyContent) => {
      const textWords = bodyContent.text.split(' ');

      return bodyAcc + textWords.length;
    }, 0);

    const total = acc + headingWords.length + bodyWordsAmount;

    return total;
  }, 0);

  const readMean = Math.ceil(mean / 200);

  const parsedLastDate = format(
    new Date(post.last_publication_date),
    "dd MMM yyyy', às ' HH:mm",
    { locale: ptBR }
  );

  return (
    <>
      <Head>
        <title>{post.data.title} | Space Traveling</title>
      </Head>

      <Header />

      <main className={styles.container}>
        <figure className={styles.figure}>
          <img src={post.data.banner.url} alt="Banner" />
        </figure>

        <article className={styles.post}>
          <h1>{post.data.title}</h1>

          <div className={commonStyles.info}>
            <div>
              <FiCalendar />

              <time>
                {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                  locale: ptBR,
                })}
              </time>
            </div>

            <div>
              <FiUser />
              <span>{post.data.author}</span>
            </div>

            <div>
              <FiClock />
              <span>{readMean} min</span>
            </div>
          </div>

          {post.last_publication_date && (
            <span>* editado em {parsedLastDate}</span>
          )}

          {post.data.content.map(content => {
            const html = RichText.asHtml(content.body);

            return (
              <div key={v4()} className={styles.postContent}>
                <h2>{content.heading}</h2>

                <div dangerouslySetInnerHTML={{ __html: html }} />
              </div>
            );
          })}

          <hr />

          <div className={styles.paginationContainer}>
            {prevpost.results[0] && (
              <Link href={`/post/${prevpost.results[0].uid}`}>
                <a>
                  <span>{prevpost.results[0].data.title}</span>
                  <strong>Post anterior</strong>
                </a>
              </Link>
            )}

            {nextpost.results[0] && (
              <Link href={`/post/${nextpost.results[0].uid}`}>
                <a>
                  <span>{nextpost.results[0].data.title}</span>
                  <strong>Próximo post</strong>
                </a>
              </Link>
            )}
          </div>
        </article>

        <UtterancesComments />

        {preview && (
          <div className={styles.post}>
            <aside className={commonStyles.preview}>
              <Link href="/api/exit-preview">
                <a>Sair do modo Preview</a>
              </Link>
            </aside>
          </div>
        )}
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    { pageSize: 10 }
  );

  const paths = posts.results.map(post => ({ params: { slug: post.uid } }));

  return { paths, fallback: true };
};

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();

  const { slug } = params;

  const response = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref ?? null,
  });

  const prevpost = await prismic.query(
    Prismic.predicates.at('document.type', 'posts'),
    {
      pageSize: 1,
      after: `${response.id}`,
      orderings: '[document.last_publication_date desc]',
    }
  );

  const nextpost = await prismic.query(
    Prismic.predicates.at('document.type', 'posts'),
    {
      pageSize: 1,
      after: `${response.id}`,
      orderings: '[document.last_publication_date]',
    }
  );

  const { uid, first_publication_date, last_publication_date } = response;
  const { title, subtitle, banner, author, content: contents } = response.data;

  const content = contents.map(contentItem => {
    const { heading, body } = contentItem;

    return { heading, body };
  });

  const post = {
    uid,
    first_publication_date,
    last_publication_date,

    data: { title, subtitle, banner, author, content },
  };

  return { props: { post, prevpost, nextpost, preview } };
};
