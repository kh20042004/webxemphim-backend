/**
 * Script để cập nhật dữ liệu phim với episodes và description
 * Chạy từ root: node src/seedMovieData.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Movie = require('./models/Movie');

// Video URL từ CDN công cộng hoặc placeholder
// Sử dụng các video từ các nguồn công cộng có thể sử dụng
const SAMPLE_VIDEO_URL = 'https://commondatastorage.googleapis.com/gtv-videos-library/sample/ForBiggerBlazes.mp4';

// Dữ liệu mẫu cho các phim
const movieUpdates = [
    {
        title: 'Lật Mặt 7: Một Điều Ước',
        description: 'Tiếp nối hành trình 6 phần trước, Lật Mặt 7 mang đến một câu chuyện thú vị về sự thay đổi và yêu thương. Một điều ước lớn sẽ thay đổi cuộc sống của những nhân vật chính. Bộ phim kết hợp hành động, hài hước và tình cảm một cách hoàn hảo.',
        episodes: [
            { name: 'Full', videoUrl: SAMPLE_VIDEO_URL, duration: 5400 }
        ]
    },
    {
        title: 'Dune: Hành Tinh Cát - Phần 2',
        description: 'Phần tiếp theo của bộ phim khoa học viễn tưởng hàng đầu. Paul Atreides tiếp tục hành trình tìm kiếm lợi ích của mình trên hành tinh Arrakis đầy nguy hiểm. Các liên minh tối mật được hình thành để tìm kiếm quyền lực. Với hình ảnh tuyệt đẹp và cốt truyện phức tạp.',
        episodes: [
            { name: 'Full', videoUrl: SAMPLE_VIDEO_URL, duration: 10320 }
        ]
    },
    {
        title: 'One Piece (Đảo Hải Tặc)',
        description: 'Theo dõi cuộc phiêu lưu của Luffy và ekip hải tặc Mũ Rơm khi họ du hành khắp các đảo để tìm kiếm kho báu One Piece. Một bộ anime huyền thoại với hành động, tình cảm và niềm vui. Bộ phim dài tập này mang lại nhiều bất ngờ và những khoảnh khắc đáng nhớ.',
        episodes: [
            { name: 'Tập 1 - Cơ duyên', videoUrl: SAMPLE_VIDEO_URL, duration: 1400 },
            { name: 'Tập 2 - Yêu chuộng', videoUrl: SAMPLE_VIDEO_URL, duration: 1400 },
            { name: 'Tập 3 - Chinh phục', videoUrl: SAMPLE_VIDEO_URL, duration: 1400 }
        ]
    },
    {
        title: 'John Wick: Phần 4',
        description: 'John Wick trở lại trong cuộc chiến tối thượng chống lại Bảng Xếp Hạng Quốc Tế. Hành động, kỹ xảo và những bí mật quá khứ sẽ được hé lộ trong phần phim hành động này. Keanu Reeves tiếp tục mang lại những cảnh hành động ngoạn mục.',
        episodes: [
            { name: 'Full', videoUrl: SAMPLE_VIDEO_URL, duration: 10080 }
        ]
    },
    {
        title: 'Hạ Cánh Nơi Anh (Crash Landing on You)',
        description: 'Một bộ phim tình cảm hài hước khi một cô gái giàu có từ Hàn Quốc tình cờ lạc vào Triều Tiên và gặp gỡ một sĩ quan quân sự. Tình yêu nảy sinh giữa hai nước đối địch. Bộ phim kết hợp tình yêu, hài hước và những cảnh tượng lãng mạn.',
        episodes: [
            { name: 'Tập 1 - Gặp gỡ', videoUrl: SAMPLE_VIDEO_URL, duration: 3600 },
            { name: 'Tập 2 - Phát triển', videoUrl: SAMPLE_VIDEO_URL, duration: 3600 },
            { name: 'Tập 3 - Cao trào', videoUrl: SAMPLE_VIDEO_URL, duration: 3600 }
        ]
    },
    {
        title: 'Avatar: The Way of Water',
        description: 'Năm sau sự kiện của Avatar, Jake và Neytiri sống hạnh phúc ở Pandora. Nhưng mối đe dọa mới từ loài người buộc họ phải rời bỏ nhà để bảo vệ những người thân yêu. Bộ phim mang đến thế giới đảo Pandora với công nghệ 3D tiên tiến.',
        episodes: [
            { name: 'Full', videoUrl: SAMPLE_VIDEO_URL, duration: 11160 }
        ]
    },
    {
        title: 'Spider-Man: Across the Spider-Verse',
        description: 'Miles Morales kết hợp cùng người bạn đồng hương mới Gwen Stacy để phối hợp với Spider-Man 2099 di chuyển qua các vũ trụ khác nhau. Một bộ phim siêu anh hùng với đồ họa đẹp mê hoặc. Cuộc phiêu lưu đa vũ trụ mang lại những trải nghiệm thị giác tuyệt vời.',
        episodes: [
            { name: 'Full', videoUrl: SAMPLE_VIDEO_URL, duration: 8040 }
        ]
    },
    {
        title: 'The Last Airbender',
        description: 'Aang, Avatar cuối cùng phải học các yếu tố để cứu thế giới khỏi cuộc chiến Quốc gia Lửa. Một bộ phim phiêu lưu hành động với các tính năng kỳ diệu. Bộ phim sắc nét về tình bạn, tình yêu và trách nhiệm.',
        episodes: [
            { name: 'Tập 1 - Khởi đầu', videoUrl: SAMPLE_VIDEO_URL, duration: 1400 },
            { name: 'Tập 2 - Huấn luyện', videoUrl: SAMPLE_VIDEO_URL, duration: 1400 },
            { name: 'Tập 3 - Cuộc chiến', videoUrl: SAMPLE_VIDEO_URL, duration: 1400 }
        ]
    },
    {
        title: 'Rap Việt',
        description: 'Chương trình thi đấu âm nhạc hiphop hàng đầu Việt Nam. Các rapper tài năng tranh tài trên sân khấu để giành chiếc quán quân danh giá. Bộ phim tài liệu về những người artis hip-hop Việt Nam với những tiết mục âm nhạc đặc sắc.',
        episodes: [
            { name: 'Tập 1 - Vòng Casting', videoUrl: SAMPLE_VIDEO_URL, duration: 4800 },
            { name: 'Tập 2 - Vòng Đối đầu', videoUrl: SAMPLE_VIDEO_URL, duration: 4800 },
            { name: 'Tập 3 - Bán kết', videoUrl: SAMPLE_VIDEO_URL, duration: 4800 }
        ]
    },
    {
        title: 'Bộ Gia',
        description: 'Một gia đình ba thế hệ sống cùng nhau trong thành phố lớn. Phim kể về những mối quan hệ, xung đột và tình yêu giữa các thành viên gia đình. Bộ phim cảm động về giá trị gia đình và những điều quý báu nhất trong cuộc sống.',
        episodes: [
            { name: 'Tập 1 - Tái ngộ', videoUrl: SAMPLE_VIDEO_URL, duration: 3600 },
            { name: 'Tập 2 - Xung đột', videoUrl: SAMPLE_VIDEO_URL, duration: 3600 },
            { name: 'Tập 3 - Hòa giải', videoUrl: SAMPLE_VIDEO_URL, duration: 3600 }
        ]
    }
];

async function updateMovies() {
    try {
        // Kết nối MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Kết nối MongoDB thành công');

        // Lấy tất cả phim
        const allMovies = await Movie.find();
        console.log(`📽️ Tìm thấy ${allMovies.length} phim trong database`);

        let updateCount = 0;

        // Cập nhật từng phim
        for (let i = 0; i < allMovies.length && i < movieUpdates.length; i++) {
            const movie = allMovies[i];
            const updateData = movieUpdates[i];

            try {
                // Sử dụng findByIdAndUpdate thay vì .save() để tránh lỗi version
                const updatedMovie = await Movie.findByIdAndUpdate(
                    movie._id,
                    {
                        description: updateData.description,
                        episodes: updateData.episodes
                    },
                    { new: true }
                );

                if (updatedMovie) {
                    console.log(`✅ Cập nhật: "${updatedMovie.title}"`);
                    console.log(`   - Description: ${updateData.description.substring(0, 50)}...`);
                    console.log(`   - Episodes: ${updateData.episodes.length} tập`);
                    updateCount++;
                }
            } catch (err) {
                console.warn(`⚠️ Lỗi cập nhật phim ${movie.title}:`, err.message);
            }
        }

        console.log(`\n🎉 Cập nhật thành công ${updateCount} phim`);
        console.log(`📺 Video URL được dùng: ${SAMPLE_VIDEO_URL}`);
        process.exit(0);

    } catch (error) {
        console.error('❌ Lỗi:', error.message);
        process.exit(1);
    }
}

// Chạy script
updateMovies();
