@php
/**
 * @var string $orderNo
 * @var string $customerName
 * @var string|int $total
 */
@endphp
<!DOCTYPE html>
<html lang="uz">
<head>
    <meta charset="UTF-8">
    <title>Buyurtma qabul qilindi</title>
</head>
<body style="font-family: Arial, sans-serif; color: #111; background: #f4f4f4; margin: 0; padding: 24px;">
    <div style="max-width: 560px; margin: 0 auto; background: #fff; padding: 24px; border-radius: 8px;">
        <h2 style="margin: 0 0 16px;">Assalomu alaykum, {{ $customerName }}!</h2>
        <p>Buyurtmangiz <strong>#{{ $orderNo }}</strong> muvaffaqiyatli qabul qilindi.</p>
        <p>Umumiy summa: <strong>{{ $total }}</strong></p>
        <p style="color: #666;">MyPOS</p>
    </div>
</body>
</html>
