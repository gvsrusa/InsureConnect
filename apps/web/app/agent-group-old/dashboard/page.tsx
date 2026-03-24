import { permanentRedirect } from "next/navigation";
// Moved — original content is at the correct URL-prefixed path
export default function Page(): never { permanentRedirect("/agent/dashboard"); }
