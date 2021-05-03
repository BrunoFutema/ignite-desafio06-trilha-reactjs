/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
export default async (_: any, res: any): Promise<void> => {
  res.clearPreviewData();

  res.writeHead(307, { Location: '/' });
  res.end();
};
