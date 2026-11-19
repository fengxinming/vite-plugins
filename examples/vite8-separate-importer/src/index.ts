import { Button, Input, Select } from 'antd';

/**
 * 演示 plugin-separate-importer 将批量导入拆分：
 *   import { Button } from 'antd'
 *   → import 'antd/es/button' + import 'antd/es/button/style'
 */
export function App(): { Button: typeof Button, Input: typeof Input, Select: typeof Select } {
  return { Button, Input, Select };
}
