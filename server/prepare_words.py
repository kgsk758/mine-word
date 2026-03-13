import requests
import os

def download_words():
    # English Words
    en_url = "https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-no-swears.txt"
    print(f"Downloading English words...")
    res_en = requests.get(en_url)
    if res_en.status_code == 200:
        words = [w for w in res_en.text.splitlines() if len(w) > 3][:5000]
        with open("words_en.txt", "w", encoding="utf-8") as f:
            for w in words: f.write(f"{w}\n")
        print("Saved words_en.txt")

    # Japanese Words (Common nouns)
    # 簡易的なリストですが、より大きなリストが必要な場合は適切なソースに差し替え可能です
    ja_words = [
        "りんご", "バナナ", "猫", "犬", "象", "花", "葡萄", "家", "氷", "ジュース",
        "山", "海", "川", "太陽", "月", "星", "森", "砂漠", "雲", "雨",
        "車", "電車", "飛行機", "自転車", "船", "本", "ペン", "コンピュータ", "電話", "テレビ",
        "時計", "机", "椅子", "鞄", "靴", "眼鏡", "箸", "皿", "コップ", "鍵",
        "学校", "病院", "公園", "銀行", "駅", "海", "空", "道", "橋", "店",
        "パン", "ご飯", "肉", "魚", "野菜", "果物", "卵", "牛乳", "水", "お茶",
        "赤", "青", "黄", "緑", "白", "黒", "金", "銀", "茶", "紫",
        "朝", "昼", "夜", "春", "夏", "秋", "冬", "今日", "明日", "昨日",
        "山登り", "散歩", "読書", "音楽", "映画", "料理", "旅行", "運動", "仕事", "勉強"
    ]
    # もし日本語のより大きなリストがあればここで取得
    with open("words_ja.txt", "w", encoding="utf-8") as f:
        for w in ja_words: f.write(f"{w}\n")
    print("Saved words_ja.txt")

if __name__ == "__main__":
    download_words()
