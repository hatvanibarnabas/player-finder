<?php

class MailService {
    public function send(string $to, string $subject, string $body): bool {
        $driver = strtolower(trim((string) (getenv('MAIL_DRIVER') ?: ($_ENV['MAIL_DRIVER'] ?? 'log'))));
        if ($driver === '') {
            $driver = 'log';
        }

        if ($driver === 'smtp') {
            return $this->sendSmtp($to, $subject, $body);
        }

        return $this->logMail($to, $subject, $body);
    }

    private function logMail(string $to, string $subject, string $body): bool {
        $line = sprintf(
            "[%s] MAIL to=%s subject=%s\n%s\n",
            date('c'),
            $to,
            $subject,
            $body
        );

        $logDir = __DIR__ . '/../storage';
        if (!is_dir($logDir)) {
            mkdir($logDir, 0775, true);
        }

        file_put_contents($logDir . '/mail.log', $line . str_repeat('-', 40) . "\n", FILE_APPEND);
        error_log(trim($line));

        return true;
    }

    private function sendSmtp(string $to, string $subject, string $body): bool {
        $host = getenv('SMTP_HOST') ?: ($_ENV['SMTP_HOST'] ?? '');
        $port = (int) (getenv('SMTP_PORT') ?: ($_ENV['SMTP_PORT'] ?? 587));
        $user = getenv('SMTP_USER') ?: ($_ENV['SMTP_USER'] ?? '');
        $pass = getenv('SMTP_PASS') ?: ($_ENV['SMTP_PASS'] ?? '');
        $from = getenv('SMTP_FROM') ?: ($_ENV['SMTP_FROM'] ?? $user);

        if ($host === '' || $from === '') {
            error_log('SMTP nincs beállítva, email logolva.');
            return $this->logMail($to, $subject, $body);
        }

        $errno = 0;
        $errstr = '';
        $socket = @fsockopen($host, $port, $errno, $errstr, 15);
        if (!$socket) {
            error_log("SMTP kapcsolat hiba: $errstr ($errno)");
            return $this->logMail($to, $subject, $body);
        }

        stream_set_timeout($socket, 15);
        $this->expect($socket, [220]);

        $this->command($socket, 'EHLO localhost', [250]);

        $crypto = strtolower(getenv('SMTP_ENCRYPTION') ?: ($_ENV['SMTP_ENCRYPTION'] ?? 'tls'));
        if ($crypto === 'tls') {
            $this->command($socket, 'STARTTLS', [220]);
            if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                fclose($socket);
                error_log('SMTP STARTTLS sikertelen, email logolva.');
                return $this->logMail($to, $subject, $body);
            }
            $this->command($socket, 'EHLO localhost', [250]);
        }

        if ($user !== '' && $pass !== '') {
            $this->command($socket, 'AUTH LOGIN', [334]);
            $this->command($socket, base64_encode($user), [334]);
            $this->command($socket, base64_encode($pass), [235]);
        }

        $this->command($socket, "MAIL FROM:<{$from}>", [250]);
        $this->command($socket, "RCPT TO:<{$to}>", [250, 251]);
        $this->command($socket, 'DATA', [354]);

        $headers = [
            "From: PlayerFinder <{$from}>",
            "To: <{$to}>",
            "Subject: {$subject}",
            'MIME-Version: 1.0',
            'Content-Type: text/plain; charset=UTF-8',
            'Content-Transfer-Encoding: 8bit',
        ];

        $message = implode("\r\n", $headers) . "\r\n\r\n" . $body . "\r\n.";
        $this->command($socket, $message, [250]);
        $this->command($socket, 'QUIT', [221]);
        fclose($socket);

        return true;
    }

    private function command($socket, string $command, array $expectedCodes): void {
        fwrite($socket, $command . "\r\n");
        $this->expect($socket, $expectedCodes);
    }

    private function expect($socket, array $expectedCodes): void {
        $response = '';
        while (($line = fgets($socket, 515)) !== false) {
            $response .= $line;
            if (isset($line[3]) && $line[3] === ' ') {
                break;
            }
        }

        $code = (int) substr($response, 0, 3);
        if (!in_array($code, $expectedCodes, true)) {
            throw new RuntimeException("SMTP váratlan válasz: {$response}");
        }
    }
}
