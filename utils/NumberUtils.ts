export function formatPriceWithDots(price: bigint): string {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
