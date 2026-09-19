import type { SVGProps } from "react";



export type IconName =

  | "call"

  | "mail"

  | "local_shipping"

  | "location_on"

  | "search"

  | "person"

  | "favorite"

  | "shopping_cart"

  | "add_shopping_cart"

  | "arrow_forward"

  | "send"

  | "photo_camera"

  | "alternate_email"

  | "check_circle"

  | "new_releases"

  | "integration_instructions"

  | "home_iot_device"

  | "schema"

  | "folder_zip"

  | "star"

  | "memory"

  | "inventory_2"

  | "verified_user"

  | "description"

  | "settings_ethernet"

  | "download"

  | "picture_as_pdf"

  | "account_tree"

  | "play_circle"

  | "chevron_left"

  | "add"

  | "remove"

  | "delete"

  | "lock"

  | "arrow_back"

  | "share"

  | "link"

  | "menu"

  | "close"

  | "sensors"

  | "support_agent"

  | "payments"

  | "developer_board"
  | "bolt"
  | "build"
  | "battery_charging_full";


const paths: Record<IconName, string> = {

  call: "M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1.1-.2 1.2.4 2.5.6 3.8.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.4 21 3 13.6 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.6.6 3.8.1.4 0 .8-.3 1.1L6.6 10.8z",

  mail: "M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5L4 8V6l8 5 8-5v2z",

  local_shipping:

    "M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.7 1.3 3 3 3s3-1.3 3-3h6c0 1.7 1.3 3 3 3s3-1.3 3-3h2v-5l-3-4zM6 18.5c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5zm13.5-9 1.9 2.5H17V9.5h2.5zM18 18.5c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5z",

  location_on:

    "M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5c-1.4 0-2.5-1.1-2.5-2.5S10.6 6.5 12 6.5s2.5 1.1 2.5 2.5S13.4 11.5 12 11.5z",

  search:

    "M15.5 14h-.8l-.3-.3A6.5 6.5 0 1 0 14 15.5l.3.3v.8l5 5 1.5-1.5-5-5zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z",

  person:

    "M12 12c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4zm0 2c-2.7 0-8 1.3-8 4v2h16v-2c0-2.7-5.3-4-8-4z",

  favorite:

    "M12 21.4 10.6 20C5.4 15.4 2 12.3 2 8.5 2 5.4 4.4 3 7.5 3c1.7 0 3.4.8 4.5 2.1C13.1 3.8 14.8 3 16.5 3 19.6 3 22 5.4 22 8.5c0 3.8-3.4 6.9-8.6 11.5L12 21.4z",

  shopping_cart:

    "M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM7.2 14h9.5c.8 0 1.4-.4 1.7-1.1L21 6H6.2l-.9-2H2v2h2l3.6 7.6L6.2 15c-.2.4-.2.8 0 1.2.3.5.8.8 1.4.8H19v-2H7.4l.8-1.5z",

  add_shopping_cart:

    "M11 9h2V6h3V4h-3V1h-2v3H8v2h3v3zm-4 9c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM7.2 14h9.5c.7 0 1.4-.4 1.7-1.1L21 6H6.2L5.3 4H2v2h2l3.6 7.6L6.2 15c-.1.4-.1.8.1 1.2.2.5.7.8 1.3.8H19v-2H7.4l.8-1.5z",

  arrow_forward: "M12 4l-1.4 1.4L16.2 11H4v2h12.2l-5.6 5.6L12 20l8-8z",

  send: "M2 21l21-9L2 3v7l15 2L2 14v7z",

  photo_camera:

    "M12 15.2A3.2 3.2 0 1 0 12 8.8a3.2 3.2 0 0 0 0 6.4zM9 2 7.2 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.2L15 2H9z",

  alternate_email:

    "M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10h5v-2h-5c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8v1.5c0 .8-.7 1.5-1.5 1.5S14 14.3 14 13.5V12c0-2.2-1.8-4-4-4s-4 1.8-4 4 1.8 4 4 4c1.1 0 2.1-.4 2.8-1.2.7.7 1.7 1.2 2.7 1.2 1.9 0 3.5-1.6 3.5-3.5V12c0-5.5-4.5-10-10-10zm0 12c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z",

  check_circle:

    "M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15-5-5 1.4-1.4L10 14.2l7.6-7.6L19 8l-9 9z",

  new_releases:

    "M23 12l-2.4-2.8.3-3.7-3.6-.8-1.9-3.2L12 2.9 8.6 1.5 6.7 4.7 3.1 5.5l.3 3.7L1 12l2.4 2.8-.3 3.7 3.6.8 1.9 3.2L12 21.1l3.4 1.4 1.9-3.2 3.6-.8-.3-3.7L23 12zM10.1 16.4 5.7 12l1.4-1.4 3 3 6.6-6.6 1.4 1.4-8 8z",

  integration_instructions:

    "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-8 12H9.5l-2-3 2-3H11l-2 3 2 3zm5.5 0H15l2-3-2-3h1.5l2 3-2 3z",

  home_iot_device:

    "M19 9V7c0-1.1-.9-2-2-2h-2V3H9v2H7c-1.1 0-2 .9-2 2v2c-1.7 0-3 1.3-3 3v7h20v-7c0-1.7-1.3-3-3-3zM7 7h10v2H7V7zm5 11c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z",

  schema:

    "M14 9V3H6v6H3v6h3v6h8v-6h3V9h-3zM8 5h4v4H8V5zm4 14H8v-4h4v4zm5-6h-3v-2h3v2z",

  folder_zip:

    "M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-2 6h-2v2h2v2h-2v2h-2v-2h2v-2h-2v-2h2v-2h-2V8h2v2h2v2z",

  star: "M12 17.3 18.2 21l-1.6-7.1L22 9.2l-7.2-.6L12 2 9.2 8.6 2 9.2l5.4 4.7L5.8 21 12 17.3z",

  memory:

    "M15 9H9v6h6V9zm-2 4h-2v-2h2v2zm8-2V9h-2V7c0-1.1-.9-2-2-2h-2V3h-2v2h-2V3H9v2H7c-1.1 0-2 .9-2 2v2H3v2h2v2H3v2h2v2c0 1.1.9 2 2 2h2v2h2v-2h2v2h2v-2h2c1.1 0 2-.9 2-2v-2h2v-2h-2v-2h2zm-4 6H7V7h10v10z",

  inventory_2:

    "M20 2H4c-1 0-2 1-2 2v3.01c0 .72.43 1.34 1 1.69V20c0 1.1 1.1 2 2 2h14c.9 0 2-.9 2-2V8.7c.57-.35 1-.97 1-1.69V4c0-1-1-2-2-2zm-5 12H9v-2h6v2zm5-7H4V4h16v3z",

  verified_user:

    "M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z",

  description:

    "M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z",

  settings_ethernet:

    "M7.8 9.1 5.4 11.5 7.8 13.9 6.4 15.3 2.6 11.5 6.4 7.7 7.8 9.1zm8.4 0 1.4-1.4 3.8 3.8-3.8 3.8-1.4-1.4 2.4-2.4-2.4-2.4zM11 21h2V3h-2v18z",

  download: "M5 20h14v-2H5v2zM19 9h-4V3H9v6H5l7 7 7-7z",

  picture_as_pdf:

    "M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z",

  account_tree:

    "M22 11V3h-7v3H9V3H2v8h7V8h2v10h4v3h7v-8h-7v3h-2V8h2v3h7zM7 9H4V5h3v4zm10 6h3v4h-3v-4zm0-10h3v4h-3V5z",

  play_circle:

    "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z",

  chevron_left: "M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z",

  add: "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z",

  remove: "M19 13H5v-2h14v2z",

  delete:

    "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z",

  lock: "M18 8h-1V6c0-2.8-2.2-5-5-5S7 3.2 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.7 1.4-3.1 3.1-3.1s3.1 1.4 3.1 3.1v2z",

  arrow_back: "M20 11H7.8l5.6-5.6L12 4l-8 8 8 8 1.4-1.4L7.8 13H20v-2z",

  share:

    "M18 16.1c-.8 0-1.4.3-1.9.8L8.9 13.1c.1-.3.1-.5.1-.8s0-.5-.1-.8l7.1-3.9c.5.4 1.1.7 1.8.7 1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3c0 .3 0 .5.1.8L8.1 9.9C7.6 9.4 7 9.1 6.2 9.1c-1.7 0-3 1.3-3 3s1.3 3 3 3c.8 0 1.4-.3 1.9-.8l7.1 4.1c-.1.2-.1.4-.1.7 0 1.6 1.3 2.9 3 2.9s2.9-1.3 2.9-2.9-1.3-2.9-2.9-2.9z",

  link: "M3.9 12c0-1.7 1.4-3.1 3.1-3.1h4V7H7c-2.8 0-5 2.2-5 5s2.2 5 5 5h4v-1.9H7c-1.7 0-3.1-1.4-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.7 0 3.1 1.4 3.1 3.1s-1.4 3.1-3.1 3.1h-4V17h4c2.8 0 5-2.2 5-5s-2.2-5-5-5z",

  menu: "M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z",

  close: "M19 6.4 17.6 5 12 10.6 6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12 19 6.4z",

  sensors:

    "M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8zm0-13c-2.8 0-5 2.2-5 5h2c0-1.7 1.3-3 3-3s3 1.3 3 3c0 1.1-.4 1.5-1.4 2.6-.9 1-2.1 2.3-2.1 4.4h2c0-1.5.7-2.3 1.6-3.3 1.1-1.2 2.4-2.6 2.4-4.7 0-2.8-2.2-5-5-5z",

  support_agent:

    "M21 12.2V11c0-4.5-3.4-8.2-7.8-8.9V1h-2.4v1.1C6.4 2.8 3 6.5 3 11v1.2c-1.2.4-2 1.5-2 2.8v2c0 1.7 1.3 3 3 3h1v-7c0-3.9 3.1-7 7-7s7 3.1 7 7v7h1c1.7 0 3-1.3 3-3v-2c0-1.3-.8-2.4-2-2.8zM9 17c0 1.7 1.3 3 3 3s3-1.3 3-3v-1H9v1z",

  payments:

    "M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z",

  developer_board:

    "M22 9V7h-2V5c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-2h2v-2h-2v-2h2v-2h-2V9h2zm-4 10H4V5h14v14zM6 13h5v4H6v-4zm6-6h4v3h-4V7zM6 7h5v5H6V7zm6 4h4v6h-4v-6z",

  bolt: "M11 21h-1l1-7H7.5c-.6 0-.9-.7-.5-1.1L13 2h1l-1 7h3.5c.6 0 .9.7.5 1.1L11 21z",

  build:
    "M22.7 19.1 19.1 22.7c-.4.4-1 .4-1.4 0l-6.7-6.7a6.5 6.5 0 0 1-8.2-8.2l3.8 3.8 1.9-1.9-3.8-3.8a6.5 6.5 0 0 1 8.2 8.2l6.7 6.7c.4.4.4 1 0 1.4z",

  battery_charging_full:
    "M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4zM13 18h-2v-2.5l2.5-3.5H11V8h2v2.5L10.5 14H13v4z",

};

const ICON_NAMES = Object.keys(paths) as IconName[];

export function isIconName(v: string | null | undefined): v is IconName {
  return !!v && (ICON_NAMES as string[]).includes(v);
}

export function resolveIconName(v: string | null | undefined, fallback: IconName = "memory"): IconName {
  return isIconName(v) ? v : fallback;
}

export function Icon({

  name,

  className,

  ...props

}: SVGProps<SVGSVGElement> & { name: IconName }) {

  const d = paths[name] || paths.memory;

  return (

    <svg

      viewBox="0 0 24 24"

      fill="currentColor"

      aria-hidden

      className={className ?? "h-5 w-5 shrink-0"}

      {...props}

    >

      <path d={d} />

    </svg>

  );

}

