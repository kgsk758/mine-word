import requests
import os

def download_words():
    url = "https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-no-swears.txt"
    print(f"Downloading words from {url}...")
    response = requests.get(url)
    if response.status_code == 200:
        words = response.text.splitlines()
        # Filter short words and keep top 5000
        filtered_words = [w for w in words if len(w) > 3][:5000]
        
        # Add some Japanese words if desired (optional)
        japanese_words = [
            "りんご", "バナナ", "猫", "犬", "象", "花", "葡萄", "家", "氷", "ジュース",
            "山", "海", "川", "太陽", "月", "星", "森", "砂漠", "雲", "雨",
            "車", "電車", "飛行機", "自転車", "船", "本", "ペン", "コンピュータ", "電話", "テレビ"
        ]
        all_words = filtered_words + japanese_words
        
        with open("words.txt", "w", encoding="utf-8") as f:
            for word in all_words:
                f.write(f"{word}\n")
        print(f"Saved {len(all_words)} words to words.txt")
    else:
        print("Failed to download word list.")

if __name__ == "__main__":
    download_words()
