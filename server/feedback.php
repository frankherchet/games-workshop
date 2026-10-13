<?php
declare(strict_types=1);
ini_set('display_errors', '0');

function reply(int $status, array $data): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    exit;
}

function issue_payload(array $data): array {
    if (!in_array($data['type'] ?? null, ['bug', 'feature'], true)
        || !is_string($data['description'] ?? null)
        || mb_strlen(trim($data['description'])) < 10 || mb_strlen($data['description']) > 4000
        || !is_array($data['context'] ?? null)) {
        throw new InvalidArgumentException('Bitte einen Typ und 10 bis 4000 Zeichen Beschreibung eingeben.');
    }
    $context = [];
    foreach (['page', 'game', 'build', 'browser', 'language', 'viewport', 'pixelRatio', 'time'] as $key) {
        $value = $data['context'][$key] ?? null;
        if (!is_string($value) || strlen($value) > 600 || preg_match('/[\x00-\x1f\x7f]/', $value)) {
            throw new InvalidArgumentException('Ungültige technische Daten. Bitte das Popup erneut öffnen.');
        }
        $context[$key] = $value;
    }
    // Quote user text and escape Markdown to avoid mentions or injected issue sections.
    $escape = static fn(string $text): string => strtr($text, [
        '&'=>'&amp;', '<'=>'&lt;', '>'=>'&gt;', '@'=>'&#64;', '\\'=>'&#92;', '`'=>'&#96;',
        '*'=>'&#42;', '_'=>'&#95;', '['=>'&#91;', ']'=>'&#93;', '#'=>'&#35;', '|'=>'&#124;', '~'=>'&#126;', '!'=>'&#33;']);
    $kind = $data['type'] === 'bug' ? 'Bug' : 'Feature';
    $description = trim($data['description']);
    $headline = preg_replace('/\s+/u', ' ', $description);
    $body = "## $kind aus der Website\n\n> " . str_replace("\n", "\n> ", $escape(str_replace("\r", '', $description))) . "\n\n## Technischer Kontext\n\n";
    foreach ($context as $key => $value) $body .= '- **' . $key . '**: ' . $escape($value) . "\n";
    return ['title' => "[$kind] " . mb_substr(str_replace('@', '＠', $headline), 0, 100), 'body' => $body];
}

function take_rate_slot(string $file, string $ip, int $now): bool {
    $handle = fopen($file, 'c+');
    if (!$handle || !flock($handle, LOCK_EX)) throw new RuntimeException('Rate storage unavailable');
    try {
        chmod($file, 0600);
        $raw = stream_get_contents($handle);
        $entries = $raw === '' ? [] : json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
        $entries = array_values(array_filter($entries, static fn($entry) => $entry['time'] > $now - 3600));
        $key = hash('sha256', $ip);
        $personal = count(array_filter($entries, static fn($entry) => $entry['ip'] === $key));
        if (count($entries) >= 30 || $personal >= 5) return false;
        $entries[] = ['ip' => $key, 'time' => $now];
        $encoded = json_encode($entries, JSON_THROW_ON_ERROR);
        rewind($handle);
        if (!ftruncate($handle, 0) || fwrite($handle, $encoded) !== strlen($encoded) || !fflush($handle)) throw new RuntimeException('Rate storage unavailable');
        return true;
    } finally { flock($handle, LOCK_UN); fclose($handle); }
}

// Tests load the pure validation and rate limiter without serving a request.
if (PHP_SAPI === 'cli') return;
try {
    if (!extension_loaded('curl') || !extension_loaded('mbstring')) reply(503, ['error' => 'Die Meldefunktion ist noch nicht verfügbar.']);
    $method = $_SERVER['REQUEST_METHOD'] ?? '';
    if (!in_array($method, ['GET', 'POST'], true)) { header('Allow: GET, POST'); reply(405, ['error' => 'Methode nicht erlaubt.']); }
    session_name('games_feedback');
    session_start(['cookie_httponly' => true, 'cookie_secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off', 'cookie_samesite' => 'Strict', 'use_strict_mode' => true]);
    if (!isset($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(32));
    $csrf = $_SESSION['csrf'];
    session_write_close();
    if ($method === 'GET') reply(200, ['service' => 'games-feedback', 'csrf' => $csrf]);
    if (($_SERVER['HTTP_ORIGIN'] ?? '') !== 'https://games.computersys.de'
        || !hash_equals($csrf, $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '')) reply(403, ['error' => 'Bitte das Popup erneut öffnen und senden.']);
    if (strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0])) !== 'application/json') reply(415, ['error' => 'JSON erforderlich.']);
    $raw = file_get_contents('php://input', false, null, 0, 16001);
    if (strlen($raw) > 16000) reply(413, ['error' => 'Die Meldung ist zu lang.']);
    try {
        $data = json_decode($raw, true, 32, JSON_THROW_ON_ERROR);
        if (!is_array($data)) throw new InvalidArgumentException('Ungültige Meldung.');
        $payload = issue_payload($data);
    } catch (JsonException | InvalidArgumentException $error) { reply(400, ['error' => 'Bitte Typ, Beschreibung und technische Daten prüfen.']); }
    $configFile = __DIR__ . '/feedback-config.php';
    if (!is_file($configFile)) reply(503, ['error' => 'Die Meldefunktion ist noch nicht eingerichtet. Dein Text bleibt erhalten.']);
    $token = require $configFile;
    if (!is_string($token) || $token === '') throw new RuntimeException('Missing token');
    $rateFile = sys_get_temp_dir() . '/games-feedback-' . hash('sha256', __DIR__) . '.json';
    if (!take_rate_slot($rateFile, $_SERVER['REMOTE_ADDR'] ?? '', time())) {
        header('Retry-After: 3600'); reply(429, ['error' => 'Zu viele Meldungen. Bitte später erneut versuchen.']);
    }
    $curl = curl_init('https://api.github.com/repos/frankherchet/games-workshop/issues');
    curl_setopt_array($curl, [CURLOPT_POST => true, CURLOPT_RETURNTRANSFER => true, CURLOPT_CONNECTTIMEOUT => 5, CURLOPT_TIMEOUT => 20,
        CURLOPT_HTTPHEADER => ['Accept: application/vnd.github+json', 'Content-Type: application/json', 'Authorization: Bearer ' . $token, 'User-Agent: ComputerSys-Games-Feedback', 'X-GitHub-Api-Version: 2026-03-10'],
        CURLOPT_POSTFIELDS => json_encode($payload, JSON_THROW_ON_ERROR)]);
    $response = curl_exec($curl);
    $code = curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    curl_close($curl);
    if ($response === false || $code !== 201) reply(502, ['error' => 'GitHub konnte die Meldung nicht bestätigen. Bitte vor erneutem Senden die Issues prüfen. Dein Text bleibt erhalten.']);
    $issue = json_decode($response, true, 32, JSON_THROW_ON_ERROR);
    if (!is_int($issue['number'] ?? null)) throw new RuntimeException('Invalid GitHub response');
    reply(201, ['number' => $issue['number']]);
} catch (Throwable $error) {
    reply(503, ['error' => 'Die Meldefunktion ist gerade nicht verfügbar. Dein Text bleibt erhalten.']);
}
