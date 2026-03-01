import { ArticlesProvider } from '@/context/ArticlesContext';

export default function ArticlesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ArticlesProvider>{children}</ArticlesProvider>;
}
