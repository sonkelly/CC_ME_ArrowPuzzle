export class VersionUtils {
    /**
     * Kiểm tra phiên bản có được hỗ trợ hay không
     * @param currentVersion Phiên bản hiện tại
     * @param targetVersion Phiên bản mục tiêu
     * @returns true nếu currentVersion >= targetVersion
     */
    static versionSupport(currentVersion: string, targetVersion: string): boolean {
        return -1 !== this.compareVersion(currentVersion, targetVersion);
    }

    /**
     * So sánh hai phiên bản
     * @param version1 Phiên bản thứ nhất
     * @param version2 Phiên bản thứ hai
     * @returns 1 nếu version1 > version2, -1 nếu version1 < version2, 0 nếu bằng nhau
     */
    static compareVersion(version1: string, version2: string): number {
        const parts1: string[] = version1.split(".");
        const parts2: string[] = version2.split(".");
        const maxLength: number = Math.max(parts1.length, parts2.length);

        // Đảm bảo độ dài bằng nhau bằng cách thêm "0" vào cuối
        while (parts1.length < maxLength) {
            parts1.push("0");
        }
        while (parts2.length < maxLength) {
            parts2.push("0");
        }

        // So sánh từng phần
        for (let i = 0; i < maxLength; i++) {
            const num1: number = parseInt(parts1[i]);
            const num2: number = parseInt(parts2[i]);

            if (num1 > num2) {
                return 1;
            }
            if (num1 < num2) {
                return -1;
            }
        }

        return 0;
    }
}