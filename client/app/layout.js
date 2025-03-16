import { Funnel_Sans } from "next/font/google";
import "./globals.css";

export const metadata = {
  title: "Orchestrator",
  description: "Automate a variety of tasks with just a few clicks",
};

const funnelSans = Funnel_Sans({ subsets: ["latin"] });

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={funnelSans.className + " bg-neutral-50"}>
        {children}
      </body>
    </html>
  );
}
