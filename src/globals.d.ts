/* ==================== 全局函数声明 ====================
 * 模板字符串（innerHTML / onclick）中调用的函数必须在此声明，
 * 并在 main.ts 挂载到 window，否则运行时报 undefined（learn_kill 不变量 ②）。
 */
declare global {
  const __APP_VERSION__: string;

  interface Window {
    /* 顶栏 */
    toggleSound(): void;
    openRules(): void;
    openCodex(): void;
    openProfile(): void;
    exitGame(): void;

    /* 弹层 */
    closeRules(): void;
    closeCodex(): void;
    closeProfile(): void;
    closeVerse(): void;
    closeContractModal(): void;
    closeMarkMenu(): void;
    openMarkMenu(seat: number): void;
    closeSettle(): void;
    switchRulesTab(tab: string): void;
    setRoleMarkUI(seat: number, roleId: string): void;
    togglePanel(id: string): void;

    /* 大厅 */
    setSelCamp(id: string): void;
    setSelRegion(id: string): void;
    setSelChar(id: string): void;
    setSelBeast(charId: string, beastId: string): void;
    toggleRole(id: string): void;

    /* 对局 */
    enterSetup(mode: 'single' | 'net'): void;
    startSingle(): void;
    createRoomUI(): void;
    joinRoomUI(): void;
    startNetUI(): void;
    againGame(): void;
    backToLobby(): void;
    sendChat(): void;
    toggleNotifyPanel(): void;
    toggleNetChat(): void;
    sendNetChat(): void;

    /* 牌桌 */
    clickSeat(seat: number): void;
    selectCard(cardId: number): void;
    confirmPlay(): void;
    doWudao(): void;
    doCloseDoor(): void;
    endTurnUI(): void;
    useSkillUI(skillId: string): void;
    signContractUI(): void;

    /* 调试钩子（冒烟脚本驱动） */
    __zmsSnapshot(): unknown;
    __zmsStart(count?: number): void;
    __zmsMakeAllAI(): void;
    __zmsTarget?: number;

    /* 主题 / 大模型设置 */
    openThemePanel(): void;
    closeThemePanel(): void;
    setThemeMode(m: 'day' | 'night' | 'dusk'): void;
    setThemeStyle(s: 'jade' | 'gold' | 'azure' | 'purple' | 'red' | 'green'): void;
    openLlmSettings(): void;
    closeLlmSettings(): void;
    llmSetProvider(p: 'openai' | 'deepseek' | 'qwen' | 'zhipu' | 'ollama' | 'custom'): void;
    llmSetEnabled(on: boolean): void;
    llmSetTakeoverAll(on: boolean): void;
    llmSetDebug(on: boolean): void;
    llmToggleSeat(i: number): void;
    llmSetField(field: 'baseURL' | 'apiKey' | 'model' | 'temperature' | 'timeoutMs', value: string): void;
    llmTestConn(): void;
  }
}

export {};
