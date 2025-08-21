import { Href, router } from "expo-router";

export const resetAndNavigate = (newPath: Href) => {
    if (router.canGoBack()) {
        router.dismissAll();
    }
    router.replace(newPath);
}

export const formatDate = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('en-US', options);
}
