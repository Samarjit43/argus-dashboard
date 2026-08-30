import "./globals.css";

export const metadata = {
  title: "Argus: The web's silent sentinel",
  description: "Autonomous web-scraping sentinel agent",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-black text-white antialiased">
        {children}
      </body>
    </html>
  );
}