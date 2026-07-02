// ============================================================
// 設定ファイル / CONFIG
// ============================================================
// 1) Google Apps Script をデプロイして取得した Web アプリの URL を
//    下の GAS_ENDPOINT に貼り付けてください。（README.md 参照）
// 2) 空のままでも動作しますが、その場合データはブラウザのコンソール
//    に出力されるだけで、どこにも保存されません（テスト用）。
// ============================================================

const GAS_ENDPOINT = "https://script.google.com/macros/s/AKfycbx3ihhsV9CsfSZZZXBAfD90teAOiNWOeEvXKYbFejCl9i86oduIaVS_h6cgV_VwXUiW/exec";

// countdown duration shown on the scam modal, in seconds
const COUNTDOWN_SECONDS = 120;

// ------------------------------------------------------------
// 4 group definitions
// group 1: Japanese / positive framing
// group 2: Japanese / negative framing
// group 3: English  / positive framing
// group 4: English  / negative framing
// ------------------------------------------------------------
const GROUPS = {
  "1": {
    lang: "ja",
    framing: "positive",
    modalTitle: "セキュリティ警告",
    message:
      "あなたの使用しているブラウザから、マルウェアが検出されました。このソフトをダウンロードすると、約20パーセントのファイルや写真データが残ります。",
    downloadLabel: "ダウンロード",
    closeLabel: "閉じる",
    countdownLabel: "残り時間",
  },
  "2": {
    lang: "ja",
    framing: "negative",
    modalTitle: "セキュリティ警告",
    message:
      "あなたの使用しているブラウザから、マルウェアが検出されました。このソフトをダウンロードしなければ、約80パーセントのファイルや写真データが削除されます。",
    downloadLabel: "ダウンロード",
    closeLabel: "閉じる",
    countdownLabel: "残り時間",
  },
  "3": {
    lang: "en",
    framing: "positive",
    modalTitle: "Security Warning",
    message:
      "The malware is detected from your device. If you download this software, about 20% of your file and photo data will remain.",
    downloadLabel: "Download",
    closeLabel: "Close",
    countdownLabel: "Time remaining",
  },
  "4": {
    lang: "en",
    framing: "negative",
    modalTitle: "Security Warning",
    message:
      "The malware is detected from your device. If you do not download this software, about 80% of your file and photo data will be deleted.",
    downloadLabel: "Download",
    closeLabel: "Close",
    countdownLabel: "Time remaining",
  },
};
