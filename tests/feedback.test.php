<?php
require __DIR__ . '/../server/feedback.php';
function check(bool $condition): void { if (!$condition) throw new RuntimeException('Check failed'); }
$context = array_fill_keys(['page','game','build','browser','language','viewport','pixelRatio','time'], 'test');
$data = ['type' => 'bug', 'description' => "Springen geht nicht\n@someone <script> [link](url)", 'context' => $context];
$issue = issue_payload($data);
check(str_starts_with($issue['title'], '[Bug] Springen'));
check(str_contains($issue['body'], '&#64;someone &lt;script&gt;'));
check(!str_contains($issue['body'], '@someone'));
$data['type'] = 'feature';
check(str_starts_with(issue_payload($data)['title'], '[Feature]'));
foreach ([['type'=>'other'], ['description'=>'kurz'], ['description'=>str_repeat('x',4001)], ['context'=>['page'=>[]]], ['context'=>array_merge($context,['game'=>"bad\nsection"])]] as $change) {
    try { issue_payload(array_merge($data, $change)); throw new RuntimeException('Accepted invalid input'); }
    catch (InvalidArgumentException $expected) {}
}
$file = tempnam(sys_get_temp_dir(), 'feedback-test-');
try {
    for ($i=0; $i<5; $i++) check(take_rate_slot($file, 'test-ip', 10000));
    check(!take_rate_slot($file, 'test-ip', 10000));
    for ($i=0; $i<25; $i++) check(take_rate_slot($file, 'other-ip-'.$i, 10000));
    check(!take_rate_slot($file, 'new-ip', 10000));
    check(take_rate_slot($file, 'test-ip', 13600));
    check(!str_contains(file_get_contents($file), 'test-ip'));
} finally { unlink($file); }
echo "Feedback validation, Markdown escaping and rate limits passed.\n";
