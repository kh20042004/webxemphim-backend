const BASE_URL = "http://localhost:5000/api/movies";

export const movieService = {
    // Hàm này sẽ lấy dữ liệu từ Backend giống hệt cách Postman làm
    getMovies: async(filters = {}) => {
        try {
            // Chuyển object {search: 'Lật Mặt'} thành query string ?search=Lật+Mặt
            const query = new URLSearchParams(filters).toString();
            const response = await fetch(`${BASE_URL}?${query}`);
            return await response.json();
        } catch (error) {
            console.error("Lỗi gọi API:", error);
            return { success: false, data: [] };
        }
    }
};