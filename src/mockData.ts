export interface HeroSkin {
  id: string;
  name: string;
  isHot: boolean; // Determines if it's placed centrally or larger
  rank: string; // e.g., 'EVO III', 'Bậc SS', 'S+ Hữu hạn'
}

export interface AccountInfo {
  totalHeroes: number;
  totalSkins: number;
  rankCurrent: string;
  rankHighest: string;
  legendaryMarks: number;
  totalMatches: number;
  winRate: number;
  featuredHeroes: HeroSkin[];
}

// Generating sample data based on the provided image concept
export const mockAccountInfo: AccountInfo = {
  totalHeroes: 125,
  totalSkins: 251,
  rankCurrent: 'Cao Thủ',
  rankHighest: 'Chiến Tướng',
  legendaryMarks: 23,
  totalMatches: 7340,
  winRate: 56.3,
  featuredHeroes: [
    { id: '1', name: 'Hoa tiêu Mộng giới', isHot: true, rank: 'Hữu hạn' },
    { id: '2', name: 'Siêu việt', isHot: true, rank: 'EVO III' },
    { id: '3', name: 'Thần tượng âm nhạc', isHot: false, rank: 'Bậc S+' },
    { id: '4', name: 'Kiemono', isHot: false, rank: 'Bậc SS' },
    { id: '5', name: 'Đôi cánh Nguyệt tộc', isHot: false, rank: 'Bậc S+' },
    { id: '6', name: 'Quận chúa đế chế', isHot: false, rank: 'Bậc S+' },
    { id: '7', name: 'Pháp sư hòa long', isHot: false, rank: 'S+ Hữu hạn' },
    { id: '8', name: 'Thần âm thực', isHot: false, rank: 'Tân xuân' },
    { id: '9', name: 'Càn nguyên thú vương', isHot: false, rank: 'Tân xuân' },
    { id: '10', name: 'Siêu việt II', isHot: false, rank: 'Bậc S+' },
    { id: '11', name: 'Seven', isHot: false, rank: 'Ultraman' },
    { id: '12', name: 'Điệp viên ký ức', isHot: false, rank: 'Liên Quân' },
    { id: '13', name: 'Hỏa thuật sư', isHot: false, rank: 'Liên Quân' },
    { id: '14', name: 'Pháp sư mèo', isHot: false, rank: 'Bậc S+' },
    { id: '15', name: 'Thần tài', isHot: false, rank: 'S+ Hữu hạn' },
    { id: '16', name: 'Qủy điện', isHot: false, rank: 'Bậc S+' },
    { id: '17', name: 'Ám tử đạo', isHot: false, rank: 'Bậc S+' },
    { id: '18', name: 'Mèo Thần tài', isHot: false, rank: 'Bậc S+' },
    { id: '19', name: 'Bboy công nghệ', isHot: false, rank: 'Bậc S+' },
    { id: '20', name: 'Gánh anh đến cùng', isHot: false, rank: 'S+ Hữu hạn' },
    { id: '21', name: 'Đặc dị', isHot: false, rank: 'Bậc S+' },
    { id: '22', name: 'Ác ma địa ngục', isHot: false, rank: 'Bậc S+' },
    { id: '23', name: 'Thợ săn chính nghĩa', isHot: false, rank: 'Tân xuân' },
  ],
};
