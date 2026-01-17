export const calculateReadTime = (content: string) => {
    const wordsPerMinute = 200; // Average reading speed
    const wordCount = content.split(" ").length;
    return Math.ceil(wordCount / wordsPerMinute);
};
