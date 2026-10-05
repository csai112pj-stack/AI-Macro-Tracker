export interface SampleMeal {
  id: string;
  name: string;
  category: string;
  description: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  imageUrl: string;
}

export const SAMPLE_MEALS: SampleMeal[] = [
  {
    id: 'sample_1',
    name: '舒肥雞胸紫米時蔬便當',
    category: '增肌減脂首選',
    description: '香嫩舒肥去皮雞胸肉、養生黑米紫米飯、水煮綠花椰菜、溏心蛋',
    mealType: 'lunch',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=700&auto=format&fit=crop&q=80'
  },
  {
    id: 'sample_2',
    name: '香煎大西洋鮭魚溫泉蛋波奇碗',
    category: '優質 Omega-3 與健康油脂',
    description: '乾煎鮭魚排、酪梨切片、水煮毛豆、紫甘藍沙拉、糙米底',
    mealType: 'dinner',
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=700&auto=format&fit=crop&q=80'
  },
  {
    id: 'sample_3',
    name: '嫩煎牛板腱佐烤地瓜時蔬',
    category: '高鐵質肌肥大補給',
    description: '嫩煎低脂牛板腱、烤紅肉金黃地瓜、大番茄、綜合蘑菇',
    mealType: 'dinner',
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=700&auto=format&fit=crop&q=80'
  },
  {
    id: 'sample_4',
    name: '高纖大燕麥希臘優格藍莓碗',
    category: '早晨喚醒與低GI能量',
    description: '大燕麥片、無糖希臘優格、水煮雙蛋、綜合無調味堅果',
    mealType: 'breakfast',
    imageUrl: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=700&auto=format&fit=crop&q=80'
  },
  {
    id: 'sample_5',
    name: '舒肥雞胸彩椒綜合生菜沙拉',
    category: '極致減脂熱量赤字',
    description: '低卡舒肥雞胸肉、甜彩椒、美生菜、牛番茄、無油和風淋醬',
    mealType: 'lunch',
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=700&auto=format&fit=crop&q=80'
  },
  {
    id: 'sample_6',
    name: '全麥培根雙蛋吐司配低脂鮮乳',
    category: '晨練爆發力複合補給',
    description: '烤全麥吐司 2 片、太陽雙蛋、低脂鮮乳一杯、奇異果',
    mealType: 'breakfast',
    imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=700&auto=format&fit=crop&q=80'
  }
];
