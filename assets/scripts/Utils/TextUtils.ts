import { JsonClassStorage, JsonClass } from "./../JsonClass";

export class TextUtils {
    static async getTextAndReplace(textId: string, replaceArr: string[]): Promise<string>{
        const text = await TextUtils.getText(textId);
        return TextUtils.replaceStrArr(text, replaceArr);
    };

    static getText(textId: string): string | null {
        if (!textId) {
            return "";
        }
        const parts = textId.split(";");
        const id = Number(parts[0]);
        const index = Number(parts[1]);
        const jsonData = JsonClassStorage.instance.getOneJson("TextData", "Textid", id);
        return jsonData ? jsonData["Str" + index] : null;
    }

    static getText_(textId: string): string | null {
        if (!textId) {
            return "";
        }
        const parts = textId.split(";");
        const id = Number(parts[0]);
        const index = Number(parts[1]);
        const jsonData = JsonClassStorage.instance.getOneJson("TextData", "Textid", id);
        return jsonData ? jsonData["Str" + index] : null;
    }

    static getText2 = async (textIdArr: [number, number]): Promise<string> => {
        if (!textIdArr || textIdArr.length < 2) {
            return "";
        }
        const id = textIdArr[0];
        const index = textIdArr[1];
        const jsonData = await JsonClass.instance.getOneJson("TextData", "Textid", id);
        return jsonData ? jsonData["Str" + index] : "";
    };

    static getText2_(textIdArr: [number, number]): string {
        if (!textIdArr || textIdArr.length < 2) {
            return "";
        }
        const id = textIdArr[0];
        const index = textIdArr[1];
        const jsonData = JsonClassStorage.instance.getOneJson("TextData", "Textid", id);
        return jsonData ? jsonData["Str" + index] : "";
    }

    static replaceStrArr(text: string, replaceArr: string[], skillProArr?: number[]): string | null {
        if (!text) {
            return null;
        }
        let result = text;
        if (replaceArr && replaceArr.length !== 0) {
            replaceArr.forEach((value, index) => {
                result = result.replace("#{value" + (index + 1) + "}", value);
            });
            if (skillProArr && skillProArr.length !== 0) {
                skillProArr.forEach((value, index) => {
                    if (value > 0) {
                        result = result.replace("#{SkillPro" + (index + 1) + "}", value / 100 + "%");
                    }
                });
            }
            return result;
        }
        return text;
    }

    static analysisRichText(richText: string): { color: string[]; text: string[] } {
        const regex = /<color=#([A-Fa-f0-9]{6})>(.*?)<\/color>/g;
        const colors: string[] = [];
        const texts: string[] = [];
        let match: RegExpExecArray | null;
        while ((match = regex.exec(richText)) !== null) {
            const color = match[1];
            const text = match[2];
            colors.push(color);
            texts.push(text);
        }
        return {
            color: colors,
            text: texts
        };
    }

    static splitMyRichText(richText: string): string {
        let result = "";
        const parsed = TextUtils.analysisRichText(richText);
        for (let i = 0; i < parsed.color.length; i++) {
            result += "\\c" + parsed.color[i] + "\\c" + parsed.text[i];
        }
        return result;
    }
}