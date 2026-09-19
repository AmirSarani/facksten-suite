import { LocaleHtmlAttrs } from "@/components/locale-html-attrs";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getSettingsMap } from "@/lib/settings";
import HomePage from "./[locale]/page";

/** FA home at /portfolio (no /fa). Same chrome as [locale] layout so lang switch keeps the header. */
export default async function RootFaHome() {
  const settings = await getSettingsMap();
  return (
    <>
      <LocaleHtmlAttrs locale="fa" />
      <SiteHeader locale="fa" settings={settings} />
      <main className="flex-1">
        <HomePage params={Promise.resolve({ locale: "fa" })} />
      </main>
      <SiteFooter locale="fa" settings={settings} />
    </>
  );
}
