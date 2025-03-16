import { Funnel_Display } from "next/font/google";
import { IconWorldLatitude } from "@tabler/icons-react";
import { usePathname } from "next/navigation";

const funnelDisplay = Funnel_Display({ subsets: ["latin"] });

const Logo = () => {
  const pathname = usePathname();
  const isAppRoute = pathname.startsWith("/app");
  const redirectTo = isAppRoute ? "/app" : "/";
  const iconSize = isAppRoute ? 19 : 22;

  return (
    <a href={redirectTo} className={funnelDisplay.className + " text-black"}>
      <p className="text-xl flex items-center">
        <IconWorldLatitude size={iconSize} />
        <span
          className="font-normal"
          style={{
            fontSize: iconSize,
          }}
        >
          rchestrator
        </span>
      </p>
    </a>
  );
};

export default Logo;
