<?php
/**
 * Enquiry form handler for PHP hosting (e.g. Hostinger). Receives the JSON POST from the website form
 * and emails it to the business inbox. Build the site with VITE_FORM_ENDPOINT=/api/enquiry.php to use it.
 *
 * Configuration lives in api/enquiry-config.php ON THE SERVER (create it once in hPanel → File Manager;
 * it is not part of the build, so re-uploading the site never overwrites it):
 *
 *   <?php return [
 *     'to'   => 'you@yourdomain.in',      // inbox that receives enquiries
 *     'from' => 'noreply@yourdomain.in',  // an address on YOUR domain (hPanel → Emails)
 *     'site' => 'FireTech',
 *   ];
 */
$cfg = is_file(__DIR__ . '/enquiry-config.php') ? (include __DIR__ . '/enquiry-config.php') : [];
define('TO_EMAIL', (string)($cfg['to'] ?? ''));
define('FROM_EMAIL', (string)($cfg['from'] ?? ''));
define('SITE_NAME', (string)($cfg['site'] ?? 'Website'));

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function respond(int $code, array $body): void {
    http_response_code($code);
    echo json_encode($body);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(405, ['success' => false, 'message' => 'Method not allowed.']);
if (TO_EMAIL === '' || FROM_EMAIL === '') respond(503, ['success' => false, 'message' => 'The enquiry form is not configured yet.']);

// Only accept submissions from this site.
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && parse_url($origin, PHP_URL_HOST) !== ($_SERVER['HTTP_HOST'] ?? '')) {
    respond(403, ['success' => false, 'message' => 'Forbidden.']);
}

$raw = file_get_contents('php://input', false, null, 0, 20000);
$d = json_decode($raw ?: '', true);
if (!is_array($d)) respond(400, ['success' => false, 'message' => 'Invalid request.']);

$f = fn(string $k, int $max = 200) => trim(mb_substr(str_replace(["\r", "\0"], '', (string)($d[$k] ?? '')), 0, $max));
$name = $f('name', 100);
$phone = $f('phone', 30);
$email = $f('email', 150);
$service = $f('service', 100);
$city = $f('city', 100);

// Server-side validation (mirrors the browser checks).
if (mb_strlen($name) < 2 || $service === '' || mb_strlen($city) < 2) respond(422, ['success' => false, 'message' => 'Please complete the required fields.']);
if (!preg_match('/^\+?[\d\s\-()]{8,20}$/', $phone)) respond(422, ['success' => false, 'message' => 'Please enter a valid phone number.']);
if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) respond(422, ['success' => false, 'message' => 'Please check the email address.']);
if (!empty($d['website'])) respond(200, ['success' => true]); // honeypot (bots)

// Basic rate limit: 5 submissions per IP per 10 minutes.
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$bucket = sys_get_temp_dir() . '/enq_' . hash('sha256', $ip);
$now = time();
$hits = array_filter(array_map('intval', @file($bucket, FILE_IGNORE_NEW_LINES) ?: []), fn($t) => $t > $now - 600);
if (count($hits) >= 5) respond(429, ['success' => false, 'message' => 'Too many requests. Please try again later.']);
$hits[] = $now;
@file_put_contents($bucket, implode("\n", $hits));

$reference = 'ENQ-' . strtoupper(substr(bin2hex(random_bytes(4)), 0, 6));
$rows = [
    'Reference' => $reference,
    'Request' => $f('intent', 60),
    'Name' => $name,
    'Company' => $f('company', 150),
    'Phone' => $phone,
    'Email' => $email,
    'Service' => $service,
    'Location' => $city,
    'Preferred date' => $f('preferred_date', 20),
    'Preferred time' => $f('preferred_window', 60),
    'Equipment quantity' => $f('equipment_quantity', 10),
    'Notes' => $f('notes', 2000),
    'Page' => $f('page', 200),
    'Submitted' => date('d M Y, H:i') . ' (server time)',
];
$body = '';
foreach ($rows as $k => $v) if ($v !== '') $body .= str_pad($k . ':', 20) . $v . "\n";

$subject = '=?UTF-8?B?' . base64_encode("[$reference] " . ($f('intent', 60) ?: 'Enquiry') . ": $service — $city") . '?=';
$headers = [
    'From: ' . SITE_NAME . ' Website <' . FROM_EMAIL . '>',
    'Content-Type: text/plain; charset=UTF-8',
    'X-Mailer: PHP',
];
if ($email !== '') $headers[] = 'Reply-To: ' . $email;

$ok = mail(TO_EMAIL, $subject, $body, implode("\r\n", $headers), '-f' . FROM_EMAIL);
if (!$ok) respond(502, ['success' => false, 'message' => 'The message could not be sent.']);
respond(200, ['success' => true, 'reference' => $reference]);
