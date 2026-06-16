import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";

const DOCS_URL = "https://functions.poehali.dev/728446de-2a8e-45c1-a93a-a0040873e23b";

const LOGO_URL =
  "https://cdn.poehali.dev/projects/9054c912-be91-4f90-8cab-0a91d0d7eafe/bucket/9db39a90-e361-4243-b645-550db60b6f4c.png";

interface Doc {
  id: number;
  title: string;
  description: string;
  category: string;
  file_url: string;
  file_name: string;
  file_size_kb: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  legal:        "Юридические",
  certificates: "Сертификаты",
  company:      "О компании",
  other:        "Прочее",
};

const CATEGORY_ICONS: Record<string, string> = {
  legal:        "Scale",
  certificates: "Award",
  company:      "Building2",
  other:        "File",
};

const EXT_ICON: Record<string, string> = {
  pdf:  "FileText",
  doc:  "FileText",
  docx: "FileText",
  jpg:  "Image",
  jpeg: "Image",
  png:  "Image",
  xls:  "Table",
  xlsx: "Table",
};

function getExt(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "file";
}

const Documents = () => {
  const [docs,    setDocs]    = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("all");

  useEffect(() => {
    fetch(DOCS_URL)
      .then(r => r.json())
      .then(d => { if (d.documents) setDocs(d.documents); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const categories = ["all", ...Array.from(new Set(docs.map(d => d.category)))];
  const filtered   = filter === "all" ? docs : docs.filter(d => d.category === filter);

  return (
    <div className="min-h-screen bg-background">
      {/* Шапка */}
      <header className="bg-white border-b border-border sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex-shrink-0">
            <img src={LOGO_URL} alt="КОНТРАКТ КОФЕ" className="h-7 w-auto object-contain"
              style={{ filter: "brightness(0)" }} />
          </Link>
          <div className="flex items-center gap-3 text-[13px] text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors flex items-center gap-1">
              <Icon name="ArrowLeft" size={14} />
              На главную
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Заголовок */}
        <div className="mb-10">
          <span className="text-[11px] font-mono text-primary tracking-widest">ДОКУМЕНТЫ</span>
          <h1 className="font-serif text-3xl md:text-4xl font-bold mt-2">
            Документы и сертификаты
          </h1>
          <p className="text-muted-foreground mt-3 text-sm max-w-md leading-relaxed">
            Юридические документы, сертификаты качества и реквизиты компании для скачивания.
          </p>
        </div>

        {/* Фильтры по категориям */}
        {categories.length > 2 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map(cat => (
              <button key={cat} onClick={() => setFilter(cat)}
                className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-all ${
                  filter === cat
                    ? "bg-foreground text-white"
                    : "bg-card border border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                }`}>
                {cat === "all" ? "Все документы" : (CATEGORY_LABELS[cat] ?? cat)}
              </button>
            ))}
          </div>
        )}

        {/* Загрузка */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Список документов */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-20">
            <Icon name="FileX" size={40} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Документы не найдены</p>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="space-y-3">
            {/* Группировка по категориям */}
            {(filter === "all"
              ? Array.from(new Set(docs.map(d => d.category)))
              : [filter]
            ).map(cat => {
              const catDocs = filtered.filter(d => d.category === cat);
              if (!catDocs.length) return null;
              return (
                <div key={cat}>
                  {filter === "all" && (
                    <div className="flex items-center gap-2 mb-3 mt-6 first:mt-0">
                      <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon name={CATEGORY_ICONS[cat] ?? "Folder"} fallback="Folder" size={13} className="text-primary" />
                      </div>
                      <h2 className="text-sm font-semibold text-muted-foreground">
                        {CATEGORY_LABELS[cat] ?? cat}
                      </h2>
                    </div>
                  )}

                  <div className="space-y-2">
                    {catDocs.map(doc => {
                      const ext      = getExt(doc.file_name);
                      const iconName = EXT_ICON[ext] ?? "File";
                      const hasFile  = doc.file_url && doc.file_url !== "#";
                      return (
                        <div key={doc.id}
                          className="flex items-center gap-4 bg-card border border-border rounded-2xl px-5 py-4 hover:border-primary/30 hover:shadow-sm transition-all group">
                          {/* Иконка */}
                          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                            <Icon name={iconName} fallback="File" size={18} className="text-muted-foreground" />
                          </div>

                          {/* Инфо */}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-foreground truncate">{doc.title}</p>
                            {doc.description && (
                              <p className="text-[12px] text-muted-foreground mt-0.5 truncate">{doc.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-mono text-muted-foreground uppercase">{ext}</span>
                              {doc.file_size_kb > 0 && (
                                <>
                                  <span className="text-muted-foreground/40">·</span>
                                  <span className="text-[10px] font-mono text-muted-foreground">
                                    {doc.file_size_kb > 1024
                                      ? `${(doc.file_size_kb / 1024).toFixed(1)} МБ`
                                      : `${doc.file_size_kb} КБ`}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Кнопка скачать */}
                          {hasFile ? (
                            <a href={doc.file_url} download={doc.file_name} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-foreground text-white text-[13px] font-medium hover:bg-foreground/80 transition-all flex-shrink-0 opacity-0 group-hover:opacity-100">
                              <Icon name="Download" size={14} />
                              Скачать
                            </a>
                          ) : (
                            <span className="text-[11px] font-mono text-muted-foreground/50 flex-shrink-0">
                              готовится
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Запрос документа */}
        <div className="mt-12 bg-secondary/50 border border-border rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon name="MessageSquare" size={18} className="text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">Нужен другой документ?</p>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              Напишите нам — вышлем нужный документ в течение рабочего дня.
            </p>
          </div>
          <a href="mailto:gid150@mail.ru"
            className="flex items-center gap-2 bg-foreground text-white px-4 py-2 rounded-xl text-[13px] font-semibold hover:bg-foreground/80 transition-all flex-shrink-0">
            <Icon name="Mail" size={14} />
            Написать
          </a>
        </div>
      </div>
    </div>
  );
};

export default Documents;
