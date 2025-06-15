
import ArticlesAndInsights from "@/components/ArticlesAndInsights";
import Footer from "@/components/Footer";
import Header from "@/components/Header";

const ArticlesPage = () => (
  <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
    <Header />
    <main className="flex-1 w-full flex flex-col items-center justify-start pt-10">
      <ArticlesAndInsights />
    </main>
    <Footer />
  </div>
);

export default ArticlesPage;
