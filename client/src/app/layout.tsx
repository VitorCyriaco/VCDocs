import { Header } from "@/components/header";
import "./globals.css";
import { SideMenu } from "@/components/sideMenu";
import { SearchProvider } from "@/context/searchContext";


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="pt-br">
      <body className="antialiased">
          <Header />
          <SideMenu />
        {children}
      </body>
    </html>
  );
}
