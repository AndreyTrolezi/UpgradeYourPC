import type { Part } from "@/app/lib/types";

export type ProductMedia = {
  imageUrl: string;
  sourceUrl: string;
  alt: string;
  match: "exact" | "line";
};

// Manufacturer-hosted product photography. An image is only attached when its
// identity can be explained to the visitor; generic catalog entries stay honest.
const mediaByPartId: Record<string, ProductMedia> = {
  "asus-prime-b550ma": {
    imageUrl: "https://www.asus.com/media/global/gallery/7qeml0vawtb9khfw_setting_xxx_0_90_end_800.png",
    sourceUrl: "https://www.asus.com/br/motherboards-components/motherboards/all-series/prime-b550m-a/",
    alt: "Placa-mãe ASUS Prime B550M-A vista de frente",
    match: "exact",
  },
  "gigabyte-b550m-aorus-elite-r13": {
    imageUrl: "https://static.gigabyte.com/StaticFile/Image/Global/f1ab8de68efb83e78d35ca69614a17ec/ProductRemoveBg/47952",
    sourceUrl: "https://www.gigabyte.com/br/Motherboard/B550M-AORUS-ELITE-rev-13",
    alt: "Placa-mãe Gigabyte B550M AORUS ELITE revisão 1.3",
    match: "exact",
  },
  "asus-prime-h610me-d4": {
    imageUrl: "https://dlcdnwebimgs.asus.com/gain/9457bb86-f547-4ee6-8648-cba3963376b6/w800",
    sourceUrl: "https://www.asus.com/motherboards-components/motherboards/prime/prime-h610m-e-d4/",
    alt: "Placa-mãe ASUS PRIME H610M-E D4 vista de frente",
    match: "exact",
  },
  "rtx3050-gainward": {
    imageUrl: "https://www.gainward.com/main/product/vga/pro/p01150/p01150_pic2_10961d2a3a5688bd.png",
    sourceUrl: "https://www.gainward.com/main/vgapro.php?id=1150&lang=pt",
    alt: "Placa de vídeo Gainward GeForce RTX 3050 Ghost",
    match: "line",
  },
  "asus-dual-rtx5060ti-o16g": {
    imageUrl: "https://dlcdnwebimgs.asus.com/gain/d9408583-9a6f-4a2b-b721-c09f1fe8cf99/w800",
    sourceUrl: "https://www.asus.com/br/motherboards-components/graphics-cards/dual/dual-rtx5060ti-o16g/",
    alt: "Placa de vídeo ASUS Dual GeForce RTX 5060 Ti OC 16 GB",
    match: "exact",
  },
  "odyssey-g5-32": {
    imageUrl: "https://images.samsung.com/is/image/samsung/p6pim/us/ls32ag552enxza/gallery/us-gaming-ls32ag552enxza-qhd-gaming-monitor-with----hz-refresh-rate-black-552144878?%24product-details-jpg%24=",
    sourceUrl: "https://www.samsung.com/us/monitors/gaming/32-inch-odyssey-g55a-curved-wqhd-gaming-monitor-sku-ls32ag552enxza/",
    alt: "Monitor Samsung Odyssey G55A de 32 polegadas",
    match: "line",
  },
  "r5-5600x": {
    imageUrl: "https://www.amd.com/content/dam/amd/en/images/products/processors/ryzen/2505503-ryzen-5-5600x.jpg",
    sourceUrl: "https://www.amd.com/en/products/processors/desktops/ryzen/5000-series/amd-ryzen-5-5600x.html",
    alt: "Processador AMD Ryzen 5 5600X",
    match: "exact",
  },
  "r7-5800x": {
    imageUrl: "https://www.amd.com/content/dam/amd/en/images/products/processors/ryzen/2505503-ryzen-7-5800x.jpg",
    sourceUrl: "https://www.amd.com/en/products/processors/desktops/ryzen/5000-series/amd-ryzen-7-5800x.html",
    alt: "Processador AMD Ryzen 7 5800X",
    match: "exact",
  },
  "r9-5900x": {
    imageUrl: "https://www.amd.com/content/dam/amd/en/images/products/processors/ryzen/2505503-ryzen-9-5900x.jpg",
    sourceUrl: "https://www.amd.com/en/products/processors/desktops/ryzen/5000-series/amd-ryzen-9-5900x.html",
    alt: "Processador AMD Ryzen 9 5900X",
    match: "exact",
  },
  "r9-5950x": {
    imageUrl: "https://www.amd.com/content/dam/amd/en/images/products/processors/ryzen/2505503-ryzen-9-5950x.jpg",
    sourceUrl: "https://www.amd.com/en/products/processors/desktops/ryzen/5000-series/amd-ryzen-9-5950x.html",
    alt: "Processador AMD Ryzen 9 5950X",
    match: "exact",
  },
  "case-cooler-master-q300l": {
    imageUrl: "https://a.storyblok.com/f/281110/1175x1120/fc2064e6df/q300l-sec1-1.png",
    sourceUrl: "https://legacy.coolermaster.com/pt-br/products/masterbox-q300l/",
    alt: "Gabinete Cooler Master MasterBox Q300L",
    match: "exact",
  },
};

export const productMediaFor = (part: Part) => mediaByPartId[part.id];
