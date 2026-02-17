import { unlinkSync, existsSync } from 'fs';

const dbPath = '/data/menya-nishiki-order.db';

console.log('=== 強制データベースリセット ===');

try {
  if (existsSync(dbPath)) {
    unlinkSync(dbPath);
    console.log('✅ データベース削除完了');
  } else {
    console.log('⚠️  データベースファイルが見つかりません');
  }
  
  if (existsSync(`${dbPath}-shm`)) {
    unlinkSync(`${dbPath}-shm`);
    console.log('✅ SHMファイル削除完了');
  }
  
  if (existsSync(`${dbPath}-wal`)) {
    unlinkSync(`${dbPath}-wal`);
    console.log('✅ WALファイル削除完了');
  }
  
  console.log('=== リセット完了 ===');
  console.log('次のステップ: Renderで Manual Deploy を実行してください');
} catch (error) {
  console.error('エラー:', error.message);
  process.exit(1);
}
