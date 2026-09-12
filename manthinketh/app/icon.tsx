import { renderIcon } from "./icons";

export const size = 32;
export const contentType = "image/png";

export default function Icon() {
  return renderIcon({ size, padding: 0 });
}
