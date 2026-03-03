import type { Order } from '../db';

type Station = 'server' | 'kitchen' | 'sushi';
type PrepStation = Exclude<Station, 'server'>;
type OrderLineItem = Order['items'][number];

interface PrintNodeConfig {
  apiKey: string;
  source: string;
  restaurantName: string;
  serverPrinterId?: number;
  kitchenPrinterId?: number;
  sushiPrinterId?: number;
  sushiKeywords: string[];
  kitchenKeywords: string[];
  defaultUnmatchedStation: PrepStation;
}

interface StationTicket {
  station: Station;
  printerId: number;
  title: string;
  body: string;
  itemsCount: number;
}

const PRINTNODE_BASE_URL = 'https://api.printnode.com';
const TICKET_LINE_WIDTH = 42;

const DEFAULT_SUSHI_KEYWORDS = [
  'sushi',
  'roll',
  'sashimi',
  'nigiri',
  'maki',
  'chirashi',
  'tataki',
  'temaki',
  'eel',
  'unagi',
  'hamachi',
  'albacore',
  'yellowtail',
  'scallop',
  'tuna',
  'salmon',
  'mackerel',
  'octopus',
  'squid',
  'ikura',
  'masago',
  'uni',
];

const DEFAULT_KITCHEN_KEYWORDS = [
  'teriyaki',
  'tempura',
  'udon',
  'ramen',
  'yakisoba',
  'gyoza',
  'tofu',
  'edamame',
  'bowl',
  'don',
  'katsu',
  'bulgogi',
  'yakitori',
  'calamari',
  'mussels',
  'oyster',
  'fried rice',
  'soup',
  'rice',
  'cheesecake',
  'mochi',
  'dessert',
  'bibimbap',
  'short rib',
  'bbq',
  'noodle',
  'cutlet',
  'curry',
];

const STATION_LABELS: Record<Station, string> = {
  server: 'SERVER / EXPO',
  kitchen: 'KITCHEN',
  sushi: 'SUSHI BAR',
};

interface ParsedOrderNotes {
  customerNotes?: string;
  systemNotices: string[];
}

function parseBooleanFlag(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) {
    return defaultValue;
  }

  const normalizedValue = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalizedValue)) {
    return true;
  }
  if (['0', 'false', 'no', 'off'].includes(normalizedValue)) {
    return false;
  }

  return defaultValue;
}

function parsePrinterId(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsedValue = Number.parseInt(value, 10);
  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    console.warn(`Invalid PrintNode printer ID "${value}" - skipping this printer.`);
    return undefined;
  }

  return parsedValue;
}

function parseKeywordList(value: string | undefined, fallback: string[]): string[] {
  if (!value) {
    return fallback;
  }

  const parsedKeywords = value
    .split(',')
    .map((keyword) => keyword.trim().toLowerCase())
    .filter(Boolean);

  return parsedKeywords.length ? parsedKeywords : fallback;
}

function getPrintNodeConfig(): PrintNodeConfig | null {
  const printNodeEnabled = parseBooleanFlag(process.env.PRINTNODE_ENABLED, false);
  if (!printNodeEnabled) {
    return null;
  }

  const apiKey = process.env.PRINTNODE_API_KEY?.trim();
  if (!apiKey) {
    console.warn('PRINTNODE_ENABLED is true but PRINTNODE_API_KEY is missing. Skipping ticket printing.');
    return null;
  }

  const serverPrinterId = parsePrinterId(process.env.PRINTNODE_SERVER_PRINTER_ID);
  const kitchenPrinterId = parsePrinterId(process.env.PRINTNODE_KITCHEN_PRINTER_ID);
  const sushiPrinterId = parsePrinterId(process.env.PRINTNODE_SUSHI_PRINTER_ID);

  if (!serverPrinterId && !kitchenPrinterId && !sushiPrinterId) {
    console.warn('PrintNode is enabled but no printer IDs are configured. Skipping ticket printing.');
    return null;
  }

  const unmatchedStationEnv = process.env.PRINTNODE_UNMATCHED_STATION?.trim().toLowerCase();
  const defaultUnmatchedStation: PrepStation = unmatchedStationEnv === 'sushi' ? 'sushi' : 'kitchen';

  return {
    apiKey,
    source: process.env.PRINTNODE_SOURCE?.trim() || 'A-Ru Sushi Online Ordering',
    restaurantName: process.env.PRINTNODE_RESTAURANT_NAME?.trim() || 'A-RU SUSHI',
    serverPrinterId,
    kitchenPrinterId,
    sushiPrinterId,
    sushiKeywords: parseKeywordList(process.env.PRINTNODE_SUSHI_KEYWORDS, DEFAULT_SUSHI_KEYWORDS),
    kitchenKeywords: parseKeywordList(
      process.env.PRINTNODE_KITCHEN_KEYWORDS,
      DEFAULT_KITCHEN_KEYWORDS
    ),
    defaultUnmatchedStation,
  };
}

function centerText(text: string, width = TICKET_LINE_WIDTH): string {
  if (text.length >= width) {
    return text.slice(0, width);
  }
  const leftPadding = Math.floor((width - text.length) / 2);
  return `${' '.repeat(leftPadding)}${text}`;
}

function horizontalRule(): string {
  return '-'.repeat(TICKET_LINE_WIDTH);
}

function wrapText(text: string, width = TICKET_LINE_WIDTH): string[] {
  const segments = text.split('\n');
  const wrapped: string[] = [];

  for (const segment of segments) {
    const trimmedSegment = segment.trim();
    if (!trimmedSegment) {
      wrapped.push('');
      continue;
    }

    const words = trimmedSegment.split(/\s+/);
    let currentLine = '';

    for (const word of words) {
      if (word.length > width) {
        if (currentLine) {
          wrapped.push(currentLine);
          currentLine = '';
        }

        let remainingWord = word;
        while (remainingWord.length > width) {
          wrapped.push(remainingWord.slice(0, width));
          remainingWord = remainingWord.slice(width);
        }
        currentLine = remainingWord;
        continue;
      }

      const nextLine = currentLine ? `${currentLine} ${word}` : word;
      if (nextLine.length <= width) {
        currentLine = nextLine;
      } else {
        wrapped.push(currentLine);
        currentLine = word;
      }
    }

    if (currentLine) {
      wrapped.push(currentLine);
    }
  }

  return wrapped;
}

function wrapPrefixedLine(prefix: string, value: string): string[] {
  const contentWidth = Math.max(8, TICKET_LINE_WIDTH - prefix.length);
  const wrappedValue = wrapText(value, contentWidth);
  if (!wrappedValue.length) {
    return [prefix.trimEnd()];
  }

  return wrappedValue.map((line, index) =>
    `${index === 0 ? prefix : ' '.repeat(prefix.length)}${line}`
  );
}

function formatMoney(value: number): string {
  return `$${value.toFixed(2)}`;
}

function formatDate(value: Date | string): string {
  return new Date(value).toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function parseOrderNotes(notes: string | null | undefined): ParsedOrderNotes {
  if (!notes) {
    return { systemNotices: [] };
  }

  const systemNotices: string[] = [];
  let remainingNotes = notes;

  remainingNotes = remainingNotes.replace(
    /\[DELIVERY ISSUE:\s*([^\]]+)\]/gi,
    (_, deliveryIssue: string) => {
      systemNotices.push(`Delivery issue: ${deliveryIssue.trim()}`);
      return '';
    }
  );

  remainingNotes = remainingNotes.replace(
    /\[REWARD APPLIED:\s*([^\]]+)\]/gi,
    (_, rewardApplied: string) => {
      systemNotices.push(`Reward applied: ${rewardApplied.trim()}`);
      return '';
    }
  );

  const customerNotes = remainingNotes.trim();
  return {
    customerNotes: customerNotes || undefined,
    systemNotices,
  };
}

function classifyItemStation(itemName: string, config: PrintNodeConfig): PrepStation {
  const normalizedName = itemName.toLowerCase();
  const matchesSushiKeyword = config.sushiKeywords.some((keyword) => normalizedName.includes(keyword));
  const matchesKitchenKeyword = config.kitchenKeywords.some((keyword) =>
    normalizedName.includes(keyword)
  );

  if (matchesSushiKeyword && !matchesKitchenKeyword) {
    return 'sushi';
  }

  if (matchesKitchenKeyword && !matchesSushiKeyword) {
    return 'kitchen';
  }

  if (matchesSushiKeyword && matchesKitchenKeyword) {
    // Sushi terms like "tempura roll" should stay with sushi station.
    return 'sushi';
  }

  return config.defaultUnmatchedStation;
}

function routeItemsToPrepStations(
  orderItems: OrderLineItem[],
  config: PrintNodeConfig
): Record<PrepStation, OrderLineItem[]> {
  const routedItems: Record<PrepStation, OrderLineItem[]> = {
    kitchen: [],
    sushi: [],
  };

  for (const item of orderItems) {
    const preferredStation = classifyItemStation(item.itemName, config);
    if (preferredStation === 'sushi') {
      if (config.sushiPrinterId) {
        routedItems.sushi.push(item);
      } else if (config.kitchenPrinterId) {
        routedItems.kitchen.push(item);
      }
      continue;
    }

    if (config.kitchenPrinterId) {
      routedItems.kitchen.push(item);
    } else if (config.sushiPrinterId) {
      routedItems.sushi.push(item);
    }
  }

  return routedItems;
}

function formatItemLine(itemLabel: string, amount: number): string[] {
  const amountLabel = formatMoney(amount);
  const itemWidth = Math.max(10, TICKET_LINE_WIDTH - amountLabel.length - 1);
  const wrappedItemLabel = wrapText(itemLabel, itemWidth);

  if (!wrappedItemLabel.length) {
    return [amountLabel];
  }

  if (wrappedItemLabel.length === 1) {
    return [`${wrappedItemLabel[0].padEnd(itemWidth)} ${amountLabel}`];
  }

  const lastLine = wrappedItemLabel.pop()!;
  return [...wrappedItemLabel, `${lastLine.padEnd(itemWidth)} ${amountLabel}`];
}

function buildTicketBody(
  station: Station,
  order: Order,
  items: OrderLineItem[],
  restaurantName: string,
  includePrices: boolean,
  includeSystemNotices: boolean
): string {
  const parsedNotes = parseOrderNotes(order.notes);
  const lines: string[] = [];

  lines.push(centerText(restaurantName.toUpperCase()));
  lines.push(centerText(`${STATION_LABELS[station]} TICKET`));
  lines.push(horizontalRule());

  lines.push(`Order #: ${order.id.slice(0, 8).toUpperCase()}`);
  lines.push(`Placed : ${formatDate(order.createdAt)}`);
  lines.push(`Type   : ${order.orderType.toUpperCase()}`);
  lines.push(`Pay    : ${order.paymentStatus.toUpperCase()}`);

  if (order.customerName) {
    lines.push(...wrapPrefixedLine('Name   : ', order.customerName));
  }
  if (order.deliveryPhone) {
    lines.push(...wrapPrefixedLine('Phone  : ', order.deliveryPhone));
  }
  if (order.orderType === 'delivery' && order.deliveryAddress) {
    lines.push(...wrapPrefixedLine('Addr   : ', order.deliveryAddress));
  }

  lines.push(horizontalRule());
  lines.push('ITEMS');

  for (const item of items) {
    const itemLabel = `${item.quantity} x ${item.itemName}`;
    const itemSubtotal = Number(item.itemPrice) * item.quantity;
    lines.push(
      ...(includePrices ? formatItemLine(itemLabel, itemSubtotal) : wrapText(itemLabel, TICKET_LINE_WIDTH))
    );

    if (item.specialNotes?.trim()) {
      lines.push(...wrapPrefixedLine('  note: ', item.specialNotes.trim()));
    }
    lines.push('');
  }

  if (lines[lines.length - 1] === '') {
    lines.pop();
  }

  if (parsedNotes.customerNotes) {
    lines.push(horizontalRule());
    lines.push('ORDER NOTES');
    lines.push(...wrapText(parsedNotes.customerNotes));
  }

  if (includeSystemNotices && parsedNotes.systemNotices.length > 0) {
    lines.push(horizontalRule());
    lines.push('SYSTEM');
    for (const notice of parsedNotes.systemNotices) {
      lines.push(...wrapText(notice));
    }
  }

  if (includePrices) {
    lines.push(horizontalRule());
    lines.push(`TOTAL: ${formatMoney(Number(order.total))}`);
  }

  lines.push(horizontalRule());
  lines.push('');
  lines.push('');

  return lines.join('\n');
}

function buildStationTickets(order: Order, config: PrintNodeConfig): StationTicket[] {
  const routedPrepItems = routeItemsToPrepStations(order.items, config);
  const shortOrderId = order.id.slice(0, 8).toUpperCase();
  const tickets: StationTicket[] = [];

  if (config.serverPrinterId) {
    tickets.push({
      station: 'server',
      printerId: config.serverPrinterId,
      title: `Order ${shortOrderId} - SERVER`,
      body: buildTicketBody('server', order, order.items, config.restaurantName, true, true),
      itemsCount: order.items.length,
    });
  }

  if (config.kitchenPrinterId && routedPrepItems.kitchen.length > 0) {
    tickets.push({
      station: 'kitchen',
      printerId: config.kitchenPrinterId,
      title: `Order ${shortOrderId} - KITCHEN`,
      body: buildTicketBody(
        'kitchen',
        order,
        routedPrepItems.kitchen,
        config.restaurantName,
        false,
        false
      ),
      itemsCount: routedPrepItems.kitchen.length,
    });
  }

  if (config.sushiPrinterId && routedPrepItems.sushi.length > 0) {
    tickets.push({
      station: 'sushi',
      printerId: config.sushiPrinterId,
      title: `Order ${shortOrderId} - SUSHI`,
      body: buildTicketBody('sushi', order, routedPrepItems.sushi, config.restaurantName, false, false),
      itemsCount: routedPrepItems.sushi.length,
    });
  }

  return tickets;
}

async function submitPrintJob(config: PrintNodeConfig, ticket: StationTicket): Promise<unknown> {
  const payload = {
    printerId: ticket.printerId,
    title: ticket.title,
    contentType: 'raw_base64',
    content: Buffer.from(ticket.body, 'utf8').toString('base64'),
    source: config.source,
  };

  const response = await fetch(`${PRINTNODE_BASE_URL}/printjobs`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.apiKey}:`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const responseBody = await response.text();
  if (!response.ok) {
    throw new Error(`PrintNode API error (${response.status}): ${responseBody}`);
  }

  if (!responseBody) {
    return null;
  }

  try {
    return JSON.parse(responseBody);
  } catch {
    return responseBody;
  }
}

export async function sendOrderTicketsToPrintNode(order: Order): Promise<void> {
  const config = getPrintNodeConfig();
  if (!config) {
    return;
  }

  const tickets = buildStationTickets(order, config);
  if (!tickets.length) {
    return;
  }

  const results = await Promise.allSettled(tickets.map((ticket) => submitPrintJob(config, ticket)));

  results.forEach((result, index) => {
    const ticket = tickets[index];
    if (result.status === 'fulfilled') {
      console.log(
        `PrintNode ticket sent (${ticket.station}) to printer ${ticket.printerId} with ${ticket.itemsCount} items.`
      );
      return;
    }

    console.error(
      `Failed to print ${ticket.station} ticket on printer ${ticket.printerId}:`,
      result.reason
    );
  });
}
