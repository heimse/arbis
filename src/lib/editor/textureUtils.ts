/**
 * Утилиты для работы с текстурами при сохранении/загрузке
 * Конвертирует blob URLs в base64 для сохранения в JSON
 * и восстанавливает их обратно при загрузке
 */

/**
 * Конвертирует blob URL в base64 data URL
 * @param blobUrl - blob URL для конвертации
 * @returns Promise с base64 data URL или null при ошибке
 */
export async function blobUrlToBase64(blobUrl: string): Promise<string | null> {
	try {
		// Если это уже base64 или data URL, возвращаем как есть
		if (blobUrl.startsWith("data:")) {
			return blobUrl;
		}

		// Если это не blob URL, возвращаем как есть (http/https URLs)
		if (!blobUrl.startsWith("blob:")) {
			return blobUrl;
		}

		// Загружаем blob по URL
		const response = await fetch(blobUrl);
		if (!response.ok) {
			console.warn("Failed to fetch blob URL:", blobUrl);
			return null;
		}

		const blob = await response.blob();

		// Конвертируем blob в base64
		return new Promise<string | null>((resolve) => {
			const reader = new FileReader();
			reader.onloadend = () => {
				const base64String = reader.result as string;
				resolve(base64String);
			};
			reader.onerror = () => {
				console.warn("Failed to convert blob to base64:", blobUrl);
				resolve(null);
			};
			reader.readAsDataURL(blob);
		});
	} catch (error) {
		console.warn("Error converting blob URL to base64:", error);
		return null;
	}
}

/**
 * Конвертирует base64 data URL обратно в blob URL
 * @param base64Url - base64 data URL для конвертации
 * @returns blob URL или исходный URL, если это не base64
 */
export function base64ToBlobUrl(
	base64Url: string | null | undefined
): string | null {
	if (!base64Url || typeof base64Url !== "string") {
		return null;
	}

	// Если это уже blob URL или обычный URL, возвращаем как есть
	if (base64Url.startsWith("blob:") || base64Url.startsWith("http")) {
		return base64Url;
	}

	// Если это не base64 data URL, возвращаем как есть
	if (!base64Url.startsWith("data:")) {
		return base64Url;
	}

	try {
		// Конвертируем base64 в blob
		const [header, base64Data] = base64Url.split(",");
		if (!header || !base64Data) {
			return null;
		}

		// Определяем MIME type из header
		const mimeMatch = header.match(/data:([^;]+)/);
		const mimeType = mimeMatch ? mimeMatch[1] : "image/png";

		// Декодируем base64
		const byteCharacters = atob(base64Data);
		const byteNumbers = new Array(byteCharacters.length);
		for (let i = 0; i < byteCharacters.length; i++) {
			byteNumbers[i] = byteCharacters.charCodeAt(i);
		}
		const byteArray = new Uint8Array(byteNumbers);
		const blob = new Blob([byteArray], { type: mimeType });

		// Создаем blob URL
		return URL.createObjectURL(blob);
	} catch (error) {
		console.warn("Error converting base64 to blob URL:", error);
		return null;
	}
}

/**
 * Конвертирует все blob URLs в объекте в base64
 * Рекурсивно обрабатывает объекты и массивы
 * @param obj - объект для обработки
 * @param textureFields - поля, которые содержат текстуры (по умолчанию 'texture' и 'floorTexture')
 * @returns Promise с объектом, где blob URLs заменены на base64
 */
export async function convertBlobUrlsToBase64(
	obj: unknown,
	textureFields: string[] = ["texture", "floorTexture"]
): Promise<unknown> {
	if (obj === null || obj === undefined) {
		return obj;
	}

	// Если это массив, обрабатываем каждый элемент
	if (Array.isArray(obj)) {
		return Promise.all(
			obj.map((item) => convertBlobUrlsToBase64(item, textureFields))
		);
	}

	// Если это объект, обрабатываем его поля
	if (typeof obj === "object") {
		const result: Record<string, unknown> = {};
		const entries = Object.entries(obj);

		await Promise.all(
			entries.map(async ([key, value]) => {
				// Если это поле с текстурой и это blob URL
				if (
					textureFields.includes(key) &&
					typeof value === "string" &&
					value.startsWith("blob:")
				) {
					const base64 = await blobUrlToBase64(value);
					result[key] = base64 || value; // Если конвертация не удалась, оставляем исходное значение
				} else if (typeof value === "object") {
					// Рекурсивно обрабатываем вложенные объекты
					result[key] = await convertBlobUrlsToBase64(value, textureFields);
				} else {
					result[key] = value;
				}
			})
		);

		return result;
	}

	// Для примитивных типов возвращаем как есть
	return obj;
}

/**
 * Конвертирует все base64 data URLs в объекте обратно в blob URLs
 * Рекурсивно обрабатывает объекты и массивы
 * @param obj - объект для обработки
 * @param textureFields - поля, которые содержат текстуры (по умолчанию 'texture' и 'floorTexture')
 * @returns объект, где base64 data URLs заменены на blob URLs
 */
export function convertBase64ToBlobUrls(
	obj: unknown,
	textureFields: string[] = ["texture", "floorTexture"]
): unknown {
	if (obj === null || obj === undefined) {
		return obj;
	}

	// Если это массив, обрабатываем каждый элемент
	if (Array.isArray(obj)) {
		return obj.map((item) => convertBase64ToBlobUrls(item, textureFields));
	}

	// Если это объект, обрабатываем его поля
	if (typeof obj === "object") {
		const result: Record<string, unknown> = {};

		for (const [key, value] of Object.entries(obj)) {
			// Если это поле с текстурой и это base64 data URL
			if (
				textureFields.includes(key) &&
				typeof value === "string" &&
				value.startsWith("data:")
			) {
				const blobUrl = base64ToBlobUrl(value);
				result[key] = blobUrl || value; // Если конвертация не удалась, оставляем исходное значение
			} else if (typeof value === "object") {
				// Рекурсивно обрабатываем вложенные объекты
				result[key] = convertBase64ToBlobUrls(value, textureFields);
			} else {
				result[key] = value;
			}
		}

		return result;
	}

	// Для примитивных типов возвращаем как есть
	return obj;
}
