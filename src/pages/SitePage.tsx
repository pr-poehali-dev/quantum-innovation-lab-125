import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import logo from "@/assets/logo.png";

const ABOUT_URL = "https://functions.poehali.dev/6745925c-6a25-46f5-aaa1-d8cd4e266142";

interface PageFile { id: number; file_url: string; file_name: string }
interface PageData { id: number; slug: string; title: string; content: string; icon: string; files: PageFile[] }

const SitePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setNotFound(false);
    fetch(ABOUT_URL, { headers: { "X-Action": "get-site-page", "X-Page-Slug": slug } })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setPage(d.page))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white border-b border-border sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex-shrink-0">
            <img src={logo} alt="КОНТРАКТ КОФЕ" width={112} height={42} className="h-7 w-auto object-contain" />
          </Link>
          <Link to="/" className="hover:text-foreground transition-colors flex items-center gap-1 text-[13px] text-muted-foreground">
            <Icon name="ArrowLeft" size={14} /> На главную
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notFound || !page ? (
          <div className="text-center py-20">
            <Icon name="FileX" size={40} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Страница не найдена</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon name={page.icon} fallback="FileText" size={18} className="text-primary" />
              </div>
              <h1 className="font-serif text-2xl md:text-3xl font-bold">{page.title}</h1>
            </div>

            <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap leading-relaxed">
              {page.content}
            </div>

            {page.files.length > 0 && (
              <div className="mt-10 space-y-2">
                <p className="text-[11px] font-mono text-muted-foreground tracking-wider mb-3">ФАЙЛЫ</p>
                {page.files.map(f => (
                  <a key={f.id} href={f.file_url} target="_blank" rel="noopener noreferrer" download={f.file_name}
                    className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3 hover:border-primary/30 transition-all">
                    <Icon name="FileText" size={16} className="text-muted-foreground flex-shrink-0" />
                    <span className="text-sm font-medium flex-1 truncate">{f.file_name}</span>
                    <Icon name="Download" size={14} className="text-primary flex-shrink-0" />
                  </a>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SitePage;
