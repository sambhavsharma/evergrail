const API_URL = process.env.EXPO_PUBLIC_API_URL

export async function listCategories() {
    var url = `${API_URL}/categories`;
    const res = await fetch(url.toString());

    if(!res.ok) {
        throw res;
    }

    const categories = await res.json();
    return categories;
}