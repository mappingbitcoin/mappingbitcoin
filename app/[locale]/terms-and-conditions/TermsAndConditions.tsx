import { Article } from "@/components/common";
import { PageSection } from "@/components/layout";

export default function TermsAndConditions({content}: {content: string}) {
    return (
        <PageSection padding="default" maxWidth="article" className="pt-12 text-center [&_article_h1]:text-4xl [&_article_h1]:text-white [&_article_h1]:my-6 [&_article_h2]:text-3xl [&_article_h2]:mt-10 [&_article_h2]:mb-2 [&_article_p]:mb-6 [&_article_p]:text-xl [&_article_em]:border-b [&_article_em]:border-accent [&_article_strong]:font-semibold">
            <h1 className="sr-only">Terms and Conditions</h1>
            <Article content={content} />
        </PageSection>
    );
}
