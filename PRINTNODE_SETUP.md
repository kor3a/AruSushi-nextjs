# PrintNode Setup (Server + Kitchen + Sushi Tickets)

This project can automatically print station tickets through PrintNode when a paid order is created.

## 1) Create or log in to PrintNode

1. Go to https://www.printnode.com/
2. Install the PrintNode Client on the in-store computer that has your printers connected.
3. Confirm each printer appears as **Online** in the PrintNode dashboard.

## 2) Get your API key

1. In PrintNode, open **Account > API Keys**
2. Create a new API key
3. Copy it to:

```env
PRINTNODE_API_KEY="your_printnode_api_key_here"
```

## 3) Get printer IDs

Each station printer in PrintNode has an integer ID.

- Server / expo printer -> `PRINTNODE_SERVER_PRINTER_ID`
- Kitchen printer -> `PRINTNODE_KITCHEN_PRINTER_ID`
- Sushi bar printer -> `PRINTNODE_SUSHI_PRINTER_ID`

## 4) Configure `.env`

Use these variables:

```env
PRINTNODE_ENABLED="true"
PRINTNODE_API_KEY="your_printnode_api_key_here"
PRINTNODE_SOURCE="A-Ru Sushi Online Ordering"
PRINTNODE_RESTAURANT_NAME="A-Ru Sushi"
PRINTNODE_SERVER_PRINTER_ID="12345"
PRINTNODE_KITCHEN_PRINTER_ID="12346"
PRINTNODE_SUSHI_PRINTER_ID="12347"
```

## 5) Optional: tune item routing by keywords

Items are auto-routed by item-name keywords.

- Sushi keywords (defaults include `sushi, roll, sashimi, ...`)
- Kitchen keywords (defaults include `teriyaki, tempura, udon, ...`)

You can override:

```env
PRINTNODE_SUSHI_KEYWORDS="sushi,roll,sashimi,nigiri,maki,chirashi,tataki,temaki"
PRINTNODE_KITCHEN_KEYWORDS="teriyaki,tempura,udon,ramen,yakisoba,gyoza,bowl,don,katsu,bulgogi"
PRINTNODE_UNMATCHED_STATION="kitchen" # kitchen or sushi
```

## Behavior

- **Server/expo ticket**: prints all items + payment/order summary.
- **Kitchen ticket**: prints only kitchen-routed items.
- **Sushi ticket**: prints only sushi-routed items.
- Printing failures do **not** block order creation.

## Where integration runs

- Hooked into: `pages/api/orders/create.ts`
- Print service: `lib/printing/sendOrderTicketsToPrintNode.ts`
