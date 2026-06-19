<?php
/**
 * Nano GDPR - simple consent log.
 *
 * Adds one line to a text file each time a visitor chooses. No database.
 * Optional: only used if you set logUrl in the widget settings.
 *
 * The log file is protected by the .htaccess in this folder so the public
 * cannot read it.
 */

header('Content-Type: text/plain');

// Only accept POST.
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    exit('POST only');
}

// The overall choice must be one of these.
$allowed = ['accepted', 'rejected', 'partial'];
$consent = $_POST['consent'] ?? '';
if (!in_array($consent, $allowed, true)) {
    http_response_code(400);
    exit('bad value');
}

// Keep only safe "category=yes/no" pairs.
$cats = [];
if (isset($_POST['categories']) && is_string($_POST['categories'])) {
    foreach (explode(';', $_POST['categories']) as $pair) {
        if (preg_match('/^([a-z0-9_-]{1,32})=(yes|no)$/', trim($pair), $m)) {
            $cats[] = $m[1] . '=' . $m[2];
        }
    }
}

// One tidy line: date, choice, categories.
$line = gmdate('Y-m-d H:i:s') . "\t"
      . $consent . "\t"
      . implode(',', $cats) . "\n";

// Append safely with a lock so two visitors at once cannot clash.
$file = __DIR__ . '/nano-gdpr-log.txt';
$fp = @fopen($file, 'a');
if ($fp) {
    if (flock($fp, LOCK_EX)) {
        fwrite($fp, $line);
        flock($fp, LOCK_UN);
    }
    fclose($fp);
}

http_response_code(204); // done, nothing to send back
