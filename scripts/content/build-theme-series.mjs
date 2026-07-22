/**
 * Theme-series contrast packs for writers.
 * Each series teaches XX／XX／XX side-by-side with 異同 notes.
 *
 * Output:
 *   seed-theme-series.json  { series[], cards[] }
 *   also merges cards into themed pipeline via merge.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));

/**
 * @typedef {{
 *   term: string, zhuyin: string, pos?: string, diff?: number,
 *   short: string, long: string, usage: string, daily: string, lit: string,
 *   tags?: string[]
 * }} TermRow
 */

/**
 * @typedef {{
 *   id: string, title: string, blurb: string, category: string,
 *   family: string, terms: TermRow[]
 * }} Series
 */

/** @type {Series[]} */
const SERIES = [
  {
    id: "color-red",
    title: "紅色譜",
    family: "顏色",
    category: "主題・顏色",
    blurb: "緋／絳／硃／丹／殷——同屬紅，濃度、溫度、場合各不同。寫衣、寫血、寫霞先選對這一格。",
    terms: [
      { term: "緋", zhuyin: "ㄈㄟ", short: "鮮紅、偏亮的紅。", long: "與絳比：緋較亮、較「新」；絳較深、較「沉」。寫裙、寫頰、寫旗可用緋；寫舊帳、暮色更深可用絳。", usage: "對照：緋＜絳＜殷（由亮到暗）。", daily: "她穿一件緋色旗袍，燈一打就更亮。", lit: "緋是還沒被時間壓暗的紅。", tags: ["顏色", "對照"] },
      { term: "絳", zhuyin: "ㄐㄧㄤˋ", short: "深紅。", long: "比緋深一階，帶古典與重量。宮廷、舊袍、秋楓常用。勿與「降」混。", usage: "「絳紫」「絳帳」。", daily: "秋山一層絳，像被夕陽醃過。", lit: "絳把熱鬧收進布料的厚裡。", tags: ["顏色", "對照"] },
      { term: "硃", zhuyin: "ㄓㄨ", short: "硃砂紅；鮮明的正紅。", long: "帶礦物／印章感。硃批、硃砂痣。比緋更「正」、更儀式。", usage: "「硃紅」「硃批」。", daily: "信封上的硃紅印還沒乾。", lit: "硃是權力蓋下去的顏色。", tags: ["顏色", "對照"] },
      { term: "丹", zhuyin: "ㄉㄢ", short: "赤紅；亦指丹藥、赤誠。", long: "可具體（丹唇）也可抽象（丹心）。比緋更文言。", usage: "「丹青」「丹心」。", daily: "他說得丹心一片，契約卻空白。", lit: "丹把忠誠寫成一種紅。", tags: ["顏色", "對照"] },
      { term: "殷", zhuyin: "ㄧㄢ", short: "黑紅、暗紅（血乾後）。", long: "最沉的紅。血、鏽、夕陽盡處。與緋對讀：一鮮一枯。", usage: "「殷紅」「殷鑑」（另義）。寫血色用殷更準。", daily: "床單上一小塊殷紅，洗不掉。", lit: "殷是故事已經發生過的紅。", tags: ["顏色", "對照"] },
    ],
  },
  {
    id: "color-blue-green",
    title: "青／碧／翠／蒼",
    family: "顏色",
    category: "主題・顏色",
    blurb: "青可藍可綠；碧偏水；翠偏新葉；蒼偏遠山與髮。選錯會讓風景「假」。",
    terms: [
      { term: "青", zhuyin: "ㄑㄧㄥ", short: "藍綠之間的古典色；亦指年輕。", long: "青衣、青天、青春。語境決定偏藍或偏綠。現代「藍／綠」更精準時，青留給文言氣或雙關。", usage: "「青出於藍」另義；寫色時接物。", daily: "窗簾是舊青，燈一開就發灰。", lit: "青是還沒被命名死的顏色。", tags: ["顏色", "對照"] },
      { term: "碧", zhuyin: "ㄅㄧˋ", short: "青玉色；澄澈的綠藍。", long: "水、空、釉。比青更「透」。碧波、碧空。", usage: "「碧綠」偏綠；「碧空」偏藍。", daily: "雨後河面一片碧。", lit: "碧把深度變成可飲的光。", tags: ["顏色", "對照"] },
      { term: "翠", zhuyin: "ㄘㄨㄟˋ", short: "翠綠；新而亮的綠。", long: "翠羽、翠綠。比蒼新、比碧「活」。寫春、寫珠寶。", usage: "「翠綠欲滴」。", daily: "新葉翠得刺眼。", lit: "翠是還在呼吸的綠。", tags: ["顏色", "對照"] },
      { term: "蒼", zhuyin: "ㄘㄤ", short: "深青；亦可寫蒼老、蒼白。", long: "蒼山、蒼茫、蒼髮。遠、舊、闊。與翠對讀：一遠一近。", usage: "注意多義：色／老／白。", daily: "天邊蒼得像要下雨。", lit: "蒼把距離染進顏色裡。", tags: ["顏色", "對照"] },
      { term: "黛", zhuyin: "ㄉㄞˋ", short: "青黑色（眉、遠山）。", long: "黛眉、黛色遠山。偏女性／古典風景。比墨柔。", usage: "「粉黛」。", daily: "她只描一痕黛。", lit: "黛是故意留下的陰影。", tags: ["顏色", "對照"] },
    ],
  },
  {
    id: "color-white-black",
    title: "白與黑的層次",
    family: "顏色",
    category: "主題・顏色",
    blurb: "縞／素／蒼白／墨／玄——「白」「黑」不夠寫時，用這些分出溫度與禮制。",
    terms: [
      { term: "縞", zhuyin: "ㄍㄠˇ", short: "白色絲織物；素白。", long: "縞衣、縞素（喪）。白裡帶布料與禮。比「白」多物性。", usage: "「縞素」。", daily: "送葬的人都縞素。", lit: "縞是白被織進規矩裡。", tags: ["顏色", "織品"] },
      { term: "素", zhuyin: "ㄙㄨˋ", short: "本色、無華；亦可寫素心。", long: "素衣、素顏、素材。可褒（潔）可淡（無飾）。", usage: "對照錦／繡。", daily: "她素顏赴會，反而更醒目。", lit: "素是拒絕表演的底色。", tags: ["顏色", "對照"] },
      { term: "墨", zhuyin: "ㄇㄛˋ", short: "黑；亦指墨汁、文字。", long: "墨色、墨衣。比玄日常，比黑有「寫」的聯想。", usage: "「墨黑」「墨跡」。", daily: "夜色濃得像未乾的墨。", lit: "墨是黑還帶著筆意。", tags: ["顏色", "對照"] },
      { term: "玄", zhuyin: "ㄒㄩㄢˊ", short: "深黑帶赤；深奧。", long: "玄衣、玄色。文言重。亦可寫玄虛。寫色時＝深黑近紫。", usage: "「玄青」。", daily: "棺木漆成玄色。", lit: "玄是黑不肯簡單。", tags: ["顏色", "對照"] },
      { term: "黧", zhuyin: "ㄌㄧˊ", short: "黑裡帶黃的暗色。", long: "面色黧黑。病、勞、風霜。比黝黑更「損」。", usage: "「臉色黧黑」。", daily: "風沙裡他黧得像土地。", lit: "黧是日子磨出來的黑。", tags: ["顏色", "面貌"] },
    ],
  },
  {
    id: "textile-silk",
    title: "中國織品：紗／羅／絹／錦／綺",
    family: "織品",
    category: "主題・織品",
    blurb: "同是絲，疏密、光澤、場合不同。寫衣裝先決定：要透、要垂、要亮，還是要壓場。",
    terms: [
      { term: "紗", zhuyin: "ㄕㄚ", short: "輕薄透光的絲織。", long: "透、輕、曖昧。夏夜、簾後、若隱若現。對照錦：一透一密。", usage: "「窗紗」「紗帷」。", daily: "窗紗一掀，巷燈漏進來。", lit: "紗把視線變成猜測。", tags: ["織品", "對照"] },
      { term: "羅", zhuyin: "ㄌㄨㄛˊ", short: "疏薄有孔的絲織；文語重。", long: "羅袖、羅帷。比紗更古、更「文」。勿與「羅列」語感混淆。", usage: "古典敘事優先。", daily: "羅袖掃過桌沿。", lit: "羅把時間往文言推半寸。", tags: ["織品", "對照"] },
      { term: "絹", zhuyin: "ㄐㄩㄢˋ", short: "薄而密的絲織；亦可寫手絹。", long: "比紗密、比錦薄。寫字畫、手帕、貼身物。", usage: "「絹本」「手絹」。", daily: "她把淚擦在舊絹上。", lit: "絹記得比嘴多。", tags: ["織品", "對照"] },
      { term: "錦", zhuyin: "ㄐㄧㄣˇ", short: "有花紋的華麗絲織。", long: "密、重、亮。儀式、排場。對照紗：壓迫感的華麗。", usage: "「錦衣」「錦緞」。", daily: "滿場錦衣，他穿舊麻。", lit: "錦是被看見的義務。", tags: ["織品", "對照"] },
      { term: "綺", zhuyin: "ㄑㄧˇ", short: "有花紋的絲織；華麗。", long: "綺羅、綺麗。比錦更「文采／美感」詞，可寫風景與文筆。", usage: "「綺麗」「綺夢」。", daily: "夢境綺得不真實。", lit: "綺是美到幾乎虛假。", tags: ["織品", "對照"] },
      { term: "綾", zhuyin: "ㄌㄧㄥˊ", short: "薄而有光的絲織。", long: "綾羅綢緞並稱。光澤柔、垂感好。寫裙擺、寫滑。", usage: "「綾羅」。", daily: "綾裙貼著小腿。", lit: "綾把動作變慢、變亮。", tags: ["織品", "對照"] },
      { term: "綢", zhuyin: "ㄔㄡˊ", short: "柔密的絲織。", long: "日常華麗。比錦低調、比紗不透。綢繆另義。", usage: "「絲綢」「綢衣」。", daily: "綢面反射走廊的燈。", lit: "綢是溫暖的光澤。", tags: ["織品", "對照"] },
      { term: "緞", zhuyin: "ㄉㄨㄢˋ", short: "表面平滑有光的絲織。", long: "緞面反光強。禮服、鞋、禮盒。比綢「硬亮」。", usage: "「緞面」「錦緞」。", daily: "緞鞋在石階上太滑。", lit: "緞拒絕吸收光線。", tags: ["織品", "對照"] },
    ],
  },
  {
    id: "textile-texture",
    title: "織品質感：縐／紈／緙／麻",
    family: "織品",
    category: "主題・織品",
    blurb: "表面怎麼「觸」：皺、細、貴、粗——人物階級與場面溫度常藏在這裡。",
    terms: [
      { term: "縐", zhuyin: "ㄓㄡˋ", short: "表面起皺的絲織。", long: "不平整變成材料屬性。比「皺」更物件。", usage: "「縐紗」。", daily: "縐裙怎麼熨都還在。", lit: "縐是心事壓不住的紋。", tags: ["織品", "質感"] },
      { term: "紈", zhuyin: "ㄨㄢˊ", short: "白色細絹；紈袴指富家子弟。", long: "細、白、貴。紈袴＝被布料標出的階級。", usage: "「紈袴」。", daily: "一屋子紈袴，沒人懂泥土。", lit: "紈是被保護過的白。", tags: ["織品", "階級"] },
      { term: "緙絲", zhuyin: "ㄎㄜˋ ㄙ", short: "通經斷緯的絲織工藝。", long: "慢、貴、不可量產。宮廷、收藏。", usage: "點到即可，勿展覽工藝說明。", daily: "那幅緙絲掛了兩百年。", lit: "緙絲是時間織進去的。", tags: ["織品", "工藝"] },
      { term: "麻", zhuyin: "ㄇㄚˊ", short: "麻織；粗、透氣、素。", long: "對照錦／緞：勞動、簡、夏。也可寫麻木（另義）。", usage: "「麻衣」「粗麻」。", daily: "他穿麻，站在錦堆裡。", lit: "麻拒絕反光。", tags: ["織品", "對照"] },
    ],
  },
  {
    id: "anger-face",
    title: "憤怒怎麼寫在臉上",
    family: "情緒・面貌",
    category: "主題・憤怒面貌",
    blurb: "勃然／怫然／慍色／睚眦／戟指——怒的速度、含蓄、出口不同。選對，場面才準。",
    terms: [
      { term: "勃然", zhuyin: "ㄅㄛˊ ㄖㄢˊ", short: "突然變臉、怒氣驟起。", long: "瞬間。會議、對質。對照怫然：勃然爆，怫然收。", usage: "「勃然大怒」「勃然變色」。", daily: "一句話，他勃然變色。", lit: "勃然是情緒的陡坡。", tags: ["憤怒", "面貌"] },
      { term: "怫然", zhuyin: "ㄈㄨˊ ㄖㄢˊ", short: "慍怒、不高興的樣子。", long: "含蓄怒。嘴角、放下杯子。文言。", usage: "「怫然不悅」。", daily: "她怫然把杯子放下。", lit: "怫然停在嘴角，還沒到吼。", tags: ["憤怒", "面貌"] },
      { term: "慍色", zhuyin: "ㄩㄣˋ ㄙㄜˋ", short: "不高興的臉色。", long: "怒的預告片。還未出口。", usage: "「面有慍色」。", daily: "他強笑，慍色還是漏了。", lit: "慍色是還沒批准的怒。", tags: ["憤怒", "面貌"] },
      { term: "睚眦", zhuyin: "ㄧㄚˊ ㄗˋ", short: "瞪眼；極小的怨忿。", long: "「睚眦必報」。微小怨恨放大成性格。", usage: "成語語境為主。", daily: "他連睚眦都記得。", lit: "睚眦是仇恨的最小單位。", tags: ["憤怒", "性格"] },
      { term: "戟指", zhuyin: "ㄐㄧˇ ㄓˇ", short: "用手指指點（常帶怒）。", long: "手先於嘴。衝突升級。", usage: "「戟指罵人」。", daily: "他戟指著合約。", lit: "戟指把話變成刺。", tags: ["憤怒", "動作"] },
      { term: "瞋目", zhuyin: "ㄔㄣ ㄇㄨˋ", short: "發怒睜大眼。", long: "文言怒視。比瞪更古。", usage: "「瞋目叱之」。", daily: "他瞋目，全場靜一秒。", lit: "瞋目是怒的對焦。", tags: ["憤怒", "面貌"] },
      { term: "悻悻然", zhuyin: "ㄒㄧㄥˋ ㄒㄧㄥˋ ㄖㄢˊ", short: "怒氣未消、不服氣。", long: "離場怒。賭氣。", usage: "「悻悻然離去」。", daily: "他悻悻然甩上門。", lit: "悻悻然還沒找到下一個出口。", tags: ["憤怒", "姿態"] },
      { term: "厲色", zhuyin: "ㄌㄧˋ ㄙㄜˋ", short: "嚴厲的神色。", long: "可怒可管教。比慍色硬。", usage: "「正顏厲色」。", daily: "老師厲色一掃，竊笑停了。", lit: "厲色把空間切開。", tags: ["憤怒", "面貌"] },
    ],
  },
  {
    id: "face-features",
    title: "長相與五官用詞",
    family: "面貌",
    category: "主題・面貌",
    blurb: "眉／眸／頰／唇——別只寫「好看／難看」，把特徵落到可畫的線。",
    terms: [
      { term: "清癯", zhuyin: "ㄑㄧㄥ ㄑㄩˊ", short: "清瘦有神。", long: "骨感≠病。對照憔悴：清癯有神，憔悴失神。", usage: "「面容清癯」。", daily: "病後他更清癯，眼更亮。", lit: "清癯是肉退後神還在。", tags: ["面貌", "對照"] },
      { term: "憔悴", zhuyin: "ㄑㄧㄠˊ ㄘㄨㄟˋ", short: "瘦弱、神色不好。", long: "勞、心事、病。對照清癯。", usage: "「形容憔悴」。", daily: "她憔悴得妆托不住。", lit: "憔悴是時間寫在臉上的草稿。", tags: ["面貌", "對照"] },
      { term: "丰儀", zhuyin: "ㄈㄥ ㄧˊ", short: "美好的儀表風度。", long: "整體氣場，不只臉。文言。", usage: "「丰儀出眾」。", daily: "他一進門，丰儀壓過西裝。", lit: "丰儀是還未開口的介紹。", tags: ["面貌", "氣度"] },
      { term: "額角", zhuyin: "ㄜˊ ㄐㄧㄠˇ", short: "額頭兩側。", long: "汗、皺、傷痕的錨點。", usage: "寫細節。", daily: "額角青筋一跳。", lit: "額角先泄露脾氣。", tags: ["面貌", "部位"] },
      { term: "顴骨", zhuyin: "ㄑㄩㄢˊ ㄍㄨˇ", short: "臉頰上的骨。", long: "高顴、陰影。可寫種族／年齡／光。", usage: "接光影。", daily: "側光把他顴骨削尖。", lit: "顴骨是臉的山脊。", tags: ["面貌", "部位"] },
      { term: "法令紋", zhuyin: "ㄈㄚˇ ㄌㄧㄥˋ ㄨㄣˊ", short: "鼻翼旁的紋。", long: "年齡、表情習慣。現代詞，小說可用。", usage: "勿嘲笑式描寫。", daily: "一笑，法令紋就深。", lit: "法令紋是表情的年輪。", tags: ["面貌", "年齡"] },
      { term: "眼袋", zhuyin: "ㄧㄢˇ ㄉㄞˋ", short: "下眼瞼浮腫。", long: "疲勞、年齡、淚。具體＞「很累」。", usage: "生活感。", daily: "眼袋重得像沒闔過眼。", lit: "眼袋是睡眠的欠條。", tags: ["面貌", "疲勞"] },
      { term: "卧蠶", zhuyin: "ㄨㄛˋ ㄘㄢˊ", short: "下眼瞼飽滿的弧。", long: "可幼態／可愛。對照眼袋：一飽滿一浮腫。", usage: "審美詞，慎刻板。", daily: "她一笑卧蠶就起來。", lit: "卧蠶是笑存進皮膚的弧。", tags: ["面貌", "對照"] },
    ],
  },
  {
    id: "sound-words",
    title: "聲音詞：聽聽場面",
    family: "感官・聲",
    category: "主題・聲音",
    blurb: "窸窣／鏗然／嗡鳴／嘎吱／颯然——聲音選定，場面的距離與危險就定了。",
    terms: [
      { term: "窸窣", zhuyin: "ㄒㄧ ㄙㄨˋ", short: "細碎輕響。", long: "布、紙、鼠、夜動。小、近、密。", usage: "「窸窣作響」。", daily: "帳後有窸窣。", lit: "窸窣讓黑暗有身體。", tags: ["聲音", "對照"] },
      { term: "鏗然", zhuyin: "ㄎㄥ ㄖㄢˊ", short: "金屬般清亮。", long: "門扣、刀、語氣堅決。短、亮、決斷。", usage: "「鏗然有聲」。", daily: "門扣鏗然鎖上。", lit: "鏗然拒絕含糊。", tags: ["聲音", "對照"] },
      { term: "嗡鳴", zhuyin: "ㄨㄥ ㄇㄧㄥˊ", short: "持續低頻響。", long: "燈管、耳鳴、焦慮。長、悶、不空。", usage: "「耳中嗡鳴」。", daily: "會議室燈管嗡鳴。", lit: "嗡鳴把沉默變稠。", tags: ["聲音", "對照"] },
      { term: "嘎吱", zhuyin: "ㄍㄚ ㄓ", short: "摩擦受壓短響。", long: "門、椅、雪、關係緊繃。警告重量。", usage: "擬聲。", daily: "他一踩，地板嘎吱。", lit: "嘎吱是空間在警告。", tags: ["聲音", "對照"] },
      { term: "颯然", zhuyin: "ㄙㄚˋ ㄖㄢˊ", short: "風聲迅疾；人亦可爽利。", long: "速度的邊。門、風、離場。", usage: "「颯然風起」。", daily: "門颯然關上。", lit: "颯然是速度留下的邊。", tags: ["聲音", "風"] },
      { term: "喑啞", zhuyin: "ㄧㄣ ㄧㄚˇ", short: "嗓音低啞不清。", long: "病、哭後、壓低密謀。對照鏗然。", usage: "「嗓音喑啞」。", daily: "他喑啞地說：別開燈。", lit: "喑啞把秘密壓在喉嚨。", tags: ["聲音", "對照"] },
      { term: "啁啾", zhuyin: "ㄓㄡ ㄐㄧㄡ", short: "鳥細碎鳴。", long: "晨、春、輕。亦可寫人聲嘈雜的輕版。", usage: "「鳥鳴啁啾」。", daily: "窗外啁啾得過分開心。", lit: "啁啾是世界還沒沉重。", tags: ["聲音", "自然"] },
      { term: "喧嘩", zhuyin: "ㄒㄩㄢ ㄏㄨㄚˊ", short: "吵雜喧鬧。", long: "人多、失控。對照岑寂。", usage: "「喧嘩一陣」。", daily: "散場喧嘩突然涌出。", lit: "喧嘩是秩序鬆脫的聲。", tags: ["聲音", "對照"] },
    ],
  },
  {
    id: "walk-verbs",
    title: "怎麼走：步態動詞",
    family: "動作",
    category: "主題・步態",
    blurb: "踱／佇／踉蹌／徜徉／逡巡——腳比嘴誠實。",
    terms: [
      { term: "踱", zhuyin: "ㄉㄨㄛˋ", short: "慢步來回。", long: "思考的腳。對照踉蹌：一控一失控。", usage: "「踱步」。", daily: "他在走廊踱到地板發亮。", lit: "踱是還沒準備好坐下。", tags: ["步態", "對照"] },
      { term: "佇", zhuyin: "ㄓㄨˋ", short: "久立。", long: "等、望、不願離。時間豎起。", usage: "「佇立」。", daily: "她在窗前佇了很久。", lit: "佇把時間豎起來。", tags: ["步態"] },
      { term: "踉蹌", zhuyin: "ㄌㄧㄤˊ ㄑㄧㄤ", short: "走路不穩。", long: "醉、傷、嚇、哭後。", usage: "「踉蹌倒下」。", daily: "他踉蹌撞上門框。", lit: "踉蹌是平衡被抽走。", tags: ["步態"] },
      { term: "徜徉", zhuyin: "ㄔㄤˊ ㄧㄤˊ", short: "安閒來回走。", long: "對照彷徨：一安一迷。", usage: "「徜徉湖畔」。", daily: "她在書店徜徉到打烊。", lit: "徜徉把時間當成院子。", tags: ["步態", "對照"] },
      { term: "逡巡", zhuyin: "ㄑㄩㄣ ㄒㄩㄣˊ", short: "顧忌而徘徊。", long: "猶豫寫成空間。對照遲疑（偏心）。", usage: "「逡巡不前」。", daily: "他在門前逡巡。", lit: "逡巡是腳比心誠實。", tags: ["步態", "猶豫"] },
      { term: "闊步", zhuyin: "ㄎㄨㄛˋ ㄅㄨˋ", short: "步子大而有氣勢。", long: "自信或示威。對照蹑足。", usage: "「闊步走進」。", daily: "她闊步穿過耳語。", lit: "闊步先占地盤。", tags: ["步態", "對照"] },
      { term: "蹑足", zhuyin: "ㄋㄧㄝˋ ㄗㄨˊ", short: "輕步、怕驚動。", long: "偷、護、怕。", usage: "「蹑足而行」。", daily: "他蹑足避開地板那塊響。", lit: "蹑足是聲音的節食。", tags: ["步態"] },
    ],
  },
  {
    id: "sad-face",
    title: "哀傷寫在臉上",
    family: "情緒・面貌",
    category: "主題・哀傷面貌",
    blurb: "黯然／泫然／愀然／戚然／潸然——哭之前、哭之中、哭之後，臉不一樣。",
    terms: [
      { term: "黯然", zhuyin: "ㄢˋ ㄖㄢˊ", short: "神色黯淡、失色。", long: "哀而不一定淚。對照泫然：一暗一濕。", usage: "「黯然神傷」。", daily: "他聽完只是黯然。", lit: "黯然是光被抽走。", tags: ["哀傷", "面貌"] },
      { term: "泫然", zhuyin: "ㄒㄩㄢˋ ㄖㄢˊ", short: "淚水將滴未滴。", long: "臨界點。比「眼淚汪汪」文言、更準。", usage: "「泫然欲泣」。", daily: "她泫然，還是把合約簽了。", lit: "泫然停在重力之前。", tags: ["哀傷", "面貌"] },
      { term: "愀然", zhuyin: "ㄑㄧㄠˇ ㄖㄢˊ", short: "臉色變嚴肅或不悅。", long: "可哀可凜。話題轉重時。", usage: "「愀然變色」。", daily: "一提舊事，他愀然。", lit: "愀然把笑折起來。", tags: ["哀傷", "面貌"] },
      { term: "戚然", zhuyin: "ㄑㄧ ㄖㄢˊ", short: "憂傷的樣子。", long: "比黯然更「心」；比痛哭含蓄。", usage: "「戚然不樂」。", daily: "滿桌歡聲，只有他戚然。", lit: "戚然是慶祝會上的裂縫。", tags: ["哀傷"] },
      { term: "潸然", zhuyin: "ㄕㄢ ㄖㄢˊ", short: "淚流的樣子。", long: "已流。文言。對照號啕：一靜一流。", usage: "「潸然淚下」。", daily: "讀到末頁，他潸然。", lit: "潸然不需要聲音。", tags: ["哀傷", "對照"] },
      { term: "哽咽", zhuyin: "ㄍㄥˇ ㄧㄝˋ", short: "喉嚨堵住、說不出。", long: "聲先於淚，或聲被淚截。", usage: "「哽咽難言」。", daily: "她哽咽了兩次才說完。", lit: "哽咽是句子的斷層。", tags: ["哀傷", "聲音"] },
      { term: "唏噓", zhuyin: "ㄒㄧ ㄒㄩ", short: "哭泣後的抽噎。", long: "餘波。場面收束用。", usage: "「唏噓不已」。", daily: "走廊還聽見唏噓。", lit: "唏噓是哭的尾音。", tags: ["哀傷", "聲音"] },
      { term: "涕泗", zhuyin: "ㄊㄧˋ ㄙˋ", short: "眼淚鼻涕齊下。", long: "失控、不美。真實大於優雅。", usage: "「涕泗縱橫」。", daily: "他哭到涕泗，顧不得形象。", lit: "涕泗拒絕詩意化。", tags: ["哀傷"] },
    ],
  },
  {
    id: "fear-face",
    title: "恐懼怎麼露臉",
    family: "情緒・面貌",
    category: "主題・恐懼面貌",
    blurb: "愕然／惶然／悚然／戰慄／毛骨——嚇的速度與深度不同。",
    terms: [
      { term: "愕然", zhuyin: "ㄜˋ ㄖㄢˊ", short: "驚訝失措。", long: "短、亮。消息撞擊。對照惶然：一驚一持續不安。", usage: "「愕然失色」。", daily: "開門的人讓他愕然。", lit: "愕然是認知被撞歪。", tags: ["恐懼", "對照"] },
      { term: "惶然", zhuyin: "ㄏㄨㄤˊ ㄖㄢˊ", short: "恐懼不安。", long: "持續。比愕然長。", usage: "「惶然不知所措」。", daily: "燈一滅，孩子惶然。", lit: "惶然找不到牆壁。", tags: ["恐懼"] },
      { term: "悚然", zhuyin: "ㄙㄨㄥˇ ㄖㄢˊ", short: "害怕而身體一緊。", long: "寒意進皮膚。文言。", usage: "「毛骨悚然」。", daily: "那句話讓他悚然。", lit: "悚然從脊椎往上爬。", tags: ["恐懼"] },
      { term: "戰慄", zhuyin: "ㄓㄢˋ ㄌㄧˋ", short: "發抖（因懼或激動）。", long: "身體證據。可懼可感動，靠語境。", usage: "「不寒而慄」近義。", daily: "他戰慄著把槍放下。", lit: "戰慄是恐懼的肌肉語言。", tags: ["恐懼", "身體"] },
      { term: "面如土色", zhuyin: "ㄇㄧㄢˋ ㄖㄨˊ ㄊㄨˇ ㄙㄜˋ", short: "嚇到臉色灰白。", long: "成語感強；場面大時可用，日常宜節制。", usage: "驚嚇高潮。", daily: "警報一響，他面如土色。", lit: "土色是血退到故事外面。", tags: ["恐懼", "面貌"] },
      { term: "噤聲", zhuyin: "ㄐㄧㄣˋ ㄕㄥ", short: "嚇得／壓得不敢出聲。", long: "聲音被權力或恐懼沒收。", usage: "「眾人噤聲」。", daily: "主管一瞪，全場噤聲。", lit: "噤聲是空氣被掐住。", tags: ["恐懼", "聲音"] },
      { term: "退避", zhuyin: "ㄊㄨㄟˋ ㄅㄧˋ", short: "往後退開。", long: "腳先於嘴。空間寫懼。", usage: "「退避三舍」另義。", daily: "狗一吠，路人退避。", lit: "退避畫出危險半徑。", tags: ["恐懼", "動作"] },
    ],
  },
  {
    id: "joy-face",
    title: "喜怎麼寫才不假",
    family: "情緒・面貌",
    category: "主題・喜悅面貌",
    blurb: "莞爾／粲然／哂／啞然／開懷——笑的尺寸與社交溫度。",
    terms: [
      { term: "莞爾", zhuyin: "ㄨㄢˇ ㄦˇ", short: "微笑。", long: "小、溫、可控。對照粲然：一斂一放。", usage: "「莞爾一笑」。", daily: "她只莞爾，沒接話。", lit: "莞爾把距離留住。", tags: ["喜悅", "對照"] },
      { term: "粲然", zhuyin: "ㄘㄢˋ ㄖㄢˊ", short: "露出牙齒的明朗笑。", long: "亮、開。宴會、釋懷。", usage: "「粲然一笑」。", daily: "消息一到，他粲然。", lit: "粲然允許被看見。", tags: ["喜悅"] },
      { term: "哂", zhuyin: "ㄕㄣˇ", short: "微笑；亦可帶譏。", long: "語境決定溫或冷。文言短。", usage: "「哂笑」。", daily: "他哂了一下，沒否認。", lit: "哂可以是刀，也可以是糖。", tags: ["喜悅", "語氣"] },
      { term: "啞然", zhuyin: "ㄧㄚˇ ㄖㄢˊ", short: "突然笑出／失聲。", long: "「啞然失笑」＝忍不住。對照噤聲。", usage: "「啞然失笑」。", daily: "認真討論到一半，大家啞然。", lit: "啞然戳破莊嚴。", tags: ["喜悅"] },
      { term: "開懷", zhuyin: "ㄎㄞ ㄏㄨㄞˊ", short: "心情暢快地（笑）。", long: "大、釋放。久壓後。", usage: "「開懷大笑」。", daily: "重逢那晚他們開懷到失聲。", lit: "開懷是胸口的窗打開。", tags: ["喜悅"] },
      { term: "忍俊", zhuyin: "ㄖㄣˇ ㄐㄩㄣˋ", short: "忍不住要笑。", long: "壓抑與洩漏的拉鋸。", usage: "「忍俊不禁」。", daily: "他忍俊，肩膀先抖。", lit: "忍俊是紀律失手。", tags: ["喜悅"] },
      { term: "眉開眼笑", zhuyin: "ㄇㄟˊ ㄎㄞ ㄧㄢˇ ㄒㄧㄠˋ", short: "整臉都笑開。", long: "成語感；寫喜慶可，寫細膩宜拆成眉／眼。", usage: "熱鬧場面。", daily: "中獎簡訊一到，他眉開眼笑。", lit: "眉與眼同時批准快樂。", tags: ["喜悅", "面貌"] },
    ],
  },
  {
    id: "look-verbs",
    title: "怎麼看：視線動詞",
    family: "動作",
    category: "主題・視線",
    blurb: "瞥／睨／盯／瞪／端詳／掃視——一眼的意圖不同。",
    terms: [
      { term: "瞥", zhuyin: "ㄆㄧㄝ", short: "很快地看一下。", long: "短、偷、不夠。對照端詳。", usage: "「瞥了一眼」。", daily: "他瞥過螢幕，假裝沒看見。", lit: "瞥是拒絕停留。", tags: ["視線", "對照"] },
      { term: "睨", zhuyin: "ㄋㄧˋ", short: "斜視。", long: "輕蔑或警戒。文言。", usage: "「睨視」「睥睨」。", daily: "她睨著合約末行。", lit: "睨把平等拿走。", tags: ["視線"] },
      { term: "盯", zhuyin: "ㄉㄧㄥ", short: "目不轉睛地看。", long: "壓力、執著。現代詞好用。", usage: "「盯著」。", daily: "孩子盯著蛋糕。", lit: "盯是慾望的釘。", tags: ["視線"] },
      { term: "瞪", zhuyin: "ㄉㄥˋ", short: "睜大眼看（常帶怒／驚）。", long: "攻擊性視線。對照莞爾的眼。", usage: "「瞪了他一眼」。", daily: "他一瞪，爭論停半秒。", lit: "瞪把話省掉。", tags: ["視線", "憤怒"] },
      { term: "端詳", zhuyin: "ㄉㄨㄢ ㄒㄧㄤˊ", short: "仔細看。", long: "時間拉長。辨認、懷疑、疼惜。", usage: "「端詳許久」。", daily: "她端詳那張舊照。", lit: "端詳允許記憶重疊。", tags: ["視線"] },
      { term: "掃視", zhuyin: "ㄙㄠˇ ㄕˋ", short: "目光快速掠過全場。", long: "蒐集情報。進出門常用。", usage: "「掃視一圈」。", daily: "他掃視出口與攝像頭。", lit: "掃視把空間做成地圖。", tags: ["視線"] },
      { term: "逼視", zhuyin: "ㄅㄧ ㄕˋ", short: "逼近地看。", long: "侵略距離。審問、對質。", usage: "「逼視對方」。", daily: "她逼視到他眨眼。", lit: "逼視壓縮空氣。", tags: ["視線"] },
      { term: "打量", zhuyin: "ㄉㄚˇ ㄌㄧㄤˋ", short: "上下估量地看。", long: "評估價值／威脅。社交入場。", usage: "「上下打量」。", daily: "保安打量他的包。", lit: "打量是無聲的估價。", tags: ["視線"] },
    ],
  },
  {
    id: "color-yellow-earth",
    title: "黃／褐／赭／彤",
    family: "顏色",
    category: "主題・顏色",
    blurb: "暖色也不止「黃」。土、血、霞各有溫度。",
    terms: [
      { term: "赭", zhuyin: "ㄓㄜˇ", short: "赤褐色。", long: "土、岩、秋。比橙沉。", usage: "「赭石」「赭衣」（古刑）。", daily: "崖壁一片赭。", lit: "赭是地心滲出來的暖。", tags: ["顏色"] },
      { term: "彤", zhuyin: "ㄊㄨㄥˊ", short: "赤紅（常寫霞、弓）。", long: "「彤雲」。比緋偏天象。", usage: "「彤雲密布」。", daily: "西邊彤得像要燒起來。", lit: "彤把天空寫成預告。", tags: ["顏色"] },
      { term: "缃", zhuyin: "ㄒㄧㄤ", short: "淺黃色（書衣、絲）。", long: "文言、書卷氣。", usage: "「缃帙」。", daily: "舊書缃得發暗。", lit: "缃是時間曬過的黃。", tags: ["顏色", "織品"] },
      { term: "黧黑", zhuyin: "ㄌㄧˊ ㄏㄟ", short: "黑黃暗沉（面色）。", long: "風霜、勞作。對照白皙。", usage: "「面目黧黑」。", daily: "出海三月，他黧黑。", lit: "黧黑是戶外寫進皮膚。", tags: ["顏色", "面貌"] },
      { term: "蒼白", zhuyin: "ㄘㄤ ㄅㄞˊ", short: "白而無血色。", long: "病、嚇、燈光。對照皙：一無神一健康。", usage: "「臉色蒼白」。", daily: "手術室外她蒼白。", lit: "蒼白是血的缺席。", tags: ["顏色", "面貌"] },
      { term: "蠟黃", zhuyin: "ㄌㄚˋ ㄏㄨㄤˊ", short: "黃得像蠟（病色）。", long: "比蒼白更「病」。忌過度歧視描寫。", usage: "面色。", daily: "他蠟黃得像沒睡一週。", lit: "蠟黃拒絕活力。", tags: ["顏色", "面貌"] },
    ],
  },
  {
    id: "speech-tone",
    title: "說話的溫度",
    family: "對話",
    category: "主題・口吻",
    blurb: "囁嚅／沉吟／喟嘆／反詰／附和——話怎麼說，比說什麼更像人。",
    terms: [
      { term: "囁嚅", zhuyin: "ㄋㄧㄝˋ ㄖㄨˊ", short: "想說又不敢清說。", long: "齒縫裡的猶豫。對照斷言。", usage: "「囁嚅半晌」。", daily: "他囁嚅：其實……", lit: "囁嚅把勇氣打折。", tags: ["口吻", "對照"] },
      { term: "沉吟", zhuyin: "ㄔㄣˊ ㄧㄣˊ", short: "低聲思索、猶豫。", long: "時間在喉嚨裡。", usage: "「沉吟片刻」。", daily: "律師沉吟，才改條款。", lit: "沉吟是決策的前奏。", tags: ["口吻"] },
      { term: "喟嘆", zhuyin: "ㄎㄨㄟˋ ㄊㄢˋ", short: "長嘆。", long: "感慨出口。比「唉」重。", usage: "「喟然長嘆」。", daily: "看完報紙他喟嘆。", lit: "喟嘆把心事拉長音。", tags: ["口吻"] },
      { term: "反詰", zhuyin: "ㄈㄢˇ ㄐㄧㄝˊ", short: "反問追逼。", long: "攻勢對話。法庭、家庭夜談。", usage: "「反詰道」。", daily: "她反詰：那你當時呢？", lit: "反詰把球砸回去。", tags: ["口吻"] },
      { term: "附和", zhuyin: "ㄈㄨˋ ㄏㄜˋ", short: "跟著贊同（可無主見）。", long: "權力場的回聲。", usage: "「隨聲附和」。", daily: "沒人真信，只是附和。", lit: "附和是最便宜的站隊。", tags: ["口吻"] },
      { term: "頂撞", zhuyin: "ㄉㄧㄥˇ ㄓㄨㄤˋ", short: "當面衝突頂回去。", long: " generational／上下級張力。", usage: "「出言頂撞」。", daily: "他終於頂撞了父親。", lit: "頂撞把等級撕開。", tags: ["口吻"] },
      { term: "嘟噥", zhuyin: "ㄉㄨ ㄋㄨㄥˊ", short: "低聲抱怨。", long: "不對人、對空氣。小孩／不服。", usage: "「一邊走一邊嘟噥」。", daily: "他嘟噥著把碗洗了。", lit: "嘟噥是未批准的抗議。", tags: ["口吻"] },
      { term: "斷言", zhuyin: "ㄉㄨㄢˋ ㄧㄢˊ", short: "斬釘截鐵地說。", long: "自信或獨斷。對照囁嚅。", usage: "「他斷言」。", daily: "專家斷言行情會回。", lit: "斷言拒絕縫隙。", tags: ["口吻", "對照"] },
    ],
  },
];

function cardFromTerm(series, t) {
  return {
    status: "active",
    term: t.term,
    zhuyin: t.zhuyin,
    part_of_speech: t.pos ?? "形／名",
    difficulty: t.diff ?? 3,
    short_def: t.short,
    long_def: t.long,
    usage_context: t.usage,
    register: "literary",
    category: series.category,
    tags: Array.from(
      new Set([
        "主題卡",
        "對照學習",
        series.family,
        `系列:${series.id}`,
        ...(t.tags ?? []),
      ]),
    ),
    daily_example: t.daily,
    literary_example: t.lit,
    source: {
      kind: "zi-geng-theme-series",
      seriesId: series.id,
      seriesTitle: series.title,
      level: "college-to-pro",
    },
  };
}

const cards = [];
const seen = new Set();
const seriesMeta = [];

for (const s of SERIES) {
  const termList = [];
  for (const t of s.terms) {
    if (seen.has(t.term)) continue;
    seen.add(t.term);
    cards.push(cardFromTerm(s, t));
    termList.push(t.term);
  }
  seriesMeta.push({
    id: s.id,
    title: s.title,
    family: s.family,
    blurb: s.blurb,
    category: s.category,
    terms: termList,
    count: termList.length,
  });
}

const payload = {
  version: 1,
  count: cards.length,
  series: seriesMeta,
  cards,
};

writeFileSync(join(__dir, "seed-theme-series.json"), JSON.stringify(payload, null, 2), "utf8");
const pub = join(__dir, "../../public/content");
mkdirSync(pub, { recursive: true });
writeFileSync(join(pub, "seed-theme-series.json"), JSON.stringify(payload), "utf8");
console.log(
  "theme series",
  seriesMeta.length,
  "cards",
  cards.length,
  seriesMeta.map((s) => `${s.id}:${s.count}`).join(", "),
);
