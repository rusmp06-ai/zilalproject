import {Header} from '@/components/layout/Header';
import {Footer} from '@/components/layout/Footer';
import {Home} from '@/components/home/Home';
import {Reveal} from '@/components/ui/Reveal';
import {content as t} from '@/data/content';
export default function Page(){return <><a className="skip-link" href="#main">{t.skip}</a><div id="top"/><Header/><main id="main"><Home/></main><Footer/><Reveal/></>}
