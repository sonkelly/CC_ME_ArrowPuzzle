export class StringUtils {
    public static removeTheParameters(url: string): string {
        if (!url) {
            return url;
        }
        if (url.indexOf("?") !== -1) {
            url = url.substring(0, url.indexOf("?"));
        }
        url = url.replace(".short.webp", "");
        return url;
    }

    public static formatRichTextColor(text: string, color: string, defaultColor?: string): string {
        let result = "<color=" + color + " >" + text + "< /color>";
        if (defaultColor) {
            result += "<color=" + defaultColor + ">< /color>";
        }
        return result;
    }

    public static formatRichTextOutline(text: string, color: string, width: string): string {
        return "<outline color=" + color + " width=" + width + " >" + text + "< /outline>";
    }

    public static randomNickName(): string {
        let firstChar = String.fromCharCode(97 + Math.floor(26 * Math.random()));
        firstChar = Math.random() > 0.5 ? firstChar.toUpperCase() : firstChar;
        let secondChar = String.fromCharCode(97 + Math.floor(26 * Math.random()));
        secondChar = Math.random() > 0.5 ? secondChar.toUpperCase() : secondChar;
        return "勇者" + firstChar + secondChar + Math.floor(9 * Math.random() + 1) + Math.floor(9 * Math.random() + 1);
    }

    public static formatRichText(text: string): string {
        const positions: number[] = [];
        let searchIndex = 0;
        while (true) {
            const foundIndex = text.indexOf("\\c", searchIndex);
            if (foundIndex === -1) {
                break;
            }
            positions.push(foundIndex);
            searchIndex = foundIndex + 10;
        }

        let result = "";
        if (positions.length > 0) {
            for (let i = 0; i < positions.length; i++) {
                const colorCode = "#" + text.substring(positions[i] + 2, positions[i] + 8);
                const content = text.substring(positions[i] + 10, i === positions.length - 1 ? text.length : positions[i + 1]);
                result += this.formatRichTextColor(content, colorCode);
            }
        } else {
            result = text;
        }
        return result;
    }
}