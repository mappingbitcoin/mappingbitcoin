import {Thing, WithContext, Article, WebSite, SoftwareApplication} from 'schema-dts'

function JsonLd<T extends Thing>(json: WithContext<T>) {
    return <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
}

export const ArticleJsonLd = JsonLd<Article>
export const WebsiteJsonLd = JsonLd<WebSite>
export const SoftwareApplicationJsonLd = JsonLd<SoftwareApplication>

export const buildToolJsonLd = (params: {
        name: string,
        description: string,
        applicationCategory: 'SecurityApplication' | 'UtilitiesApplication',
        url: string,
}) => null // Disabled structured data for SEO optimization
