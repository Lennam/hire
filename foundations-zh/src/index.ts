export interface ErrorMessage {
    message: string;
    stack: {
        line: number;
        column: number;
        filename: string;
    }[];
}

const CHROME_STACK_REGEXP = /^\s*at .*(\S+:\d+|\(native\))/m;
const FIREFOX_STACK_REGEXP = /(^|@)\S+:\d+/;
const EXTRACT_REGEXP = /(.+?)(?::(\d+))?(?::(\d+))?$/;

export function parseError(err: Error): ErrorMessage {
    // implement
    let type = '',
        filtedStack;
    if (err.stack && err.stack.match(CHROME_STACK_REGEXP)) {
        type = 'chrome';
        // 筛选带有文件信息和位置的行
        filtedStack = err.stack
            .split('\n')
            .filter((line) => !!line.match(CHROME_STACK_REGEXP) && !line.includes('<anonymous>'));
    } else if (err.stack) {
        type = 'firefox';
        filtedStack = err.stack
            .split('\n')
            .filter(
                (line) =>
                    !!line.replace(/\s+/, '').match(FIREFOX_STACK_REGEXP) &&
                    !line.includes('<anonymous>')
            );
    } else {
        throw new Error('无法解析的错误类型');
    }
    if (filtedStack) {
        return {
            message: err.message,
            stack: filtedStack
                .map((info) => {
                    let locations = '';
                    if (type === 'chrome') {
                        locations = info.split(/\s+/).pop();
                    } else if (type === 'firefox') {
                        locations = info.replace(/\s+/, '').split('@').pop();
                    }
                    const chunk = EXTRACT_REGEXP.exec(locations);
                    return {
                        line: chunk ? Number(chunk[2]) : 0,
                        column: chunk ? Number(chunk[3]) : 0,
                        filename: chunk ? chunk[1] : ''
                    };
                })
                .filter((stack) => stack.filename !== '<anonymous>' || stack.filename !== '')
        };
    } else {
        return {
            message: err.message,
            stack: []
        };
    }
}
