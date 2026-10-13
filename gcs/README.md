# 成人用GCS評価

反応の説明から開眼E、言語V、最良の運動Mを選択し、内訳と合計を表示する静的アプリです。初期状態は未選択。未評価を1点として扱いません。

NTを1項目でも含む場合は合計を算出せず、内訳と評価不能の理由を記録します。NT理由は任意入力。記録用テキストをコピーでき、クリップボード利用不可時は手動コピー欄を表示します。入力値は保存・送信しません。成人用で、小児GCS・GCS-P・JCS換算は対象外。重症度や処置方針の自動判定も行いません。

説明は以下の公式基準を日本語で要約しています（2026-10-13確認）。公式評価票そのものの転載や公式アプリではありません。

- https://www.glasgowcomascale.org/downloads/GCS-Assessment-Aid-Japanese.pdf
- https://www.glasgowcomascale.org/downloads/GCS-Assessment-Aid-English.pdf
- https://www.glasgowcomascale.org/faq/

`node gcs/test.cjs` で、スコア上下限、各項目の入力検証、未評価・NT時の合計抑制、コピー用記録形式を検証します。ブラウザでの視覚検証は未実施。
