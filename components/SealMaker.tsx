"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import {
  CheckCircle,
  BadgeDollarSign,
  Inbox,
  Award,
  Lock,
  ShieldCheck,
} from "lucide-react";

export default function SealMaker() {
  const sealRef =
    useRef<HTMLDivElement>(null);

  const [topText, setTopText] =
    useState("Organization Name");

  const [
    centerText,
    setCenterText,
  ] = useState("Center Text");

  const [
    bottomText,
    setBottomText,
  ] = useState("Bottom Text");

  const [sealColor, setSealColor] =
    useState("#B91C1C");

  const [sealSize, setSealSize] =
    useState(250);

  const [borderWidth, setBorderWidth] =
    useState(4);

  const [fontFamily, setFontFamily] =
    useState("Arial");

  const [logoPreview, setLogoPreview] =
    useState<string | null>(null);

  const [topFontSize, setTopFontSize] =
    useState(18);

  const [
    centerFontSize,
    setCenterFontSize,
  ] = useState(20);

  const [
    bottomFontSize,
    setBottomFontSize,
  ] = useState(18);

  const [starSize, setStarSize] =
    useState(18);

  const [sealShape, setSealShape] =
    useState<"circle" | "oval">(
        "circle"
  );

  const [ovalWidth, setOvalWidth] =
    useState(240);

  const [ovalHeight, setOvalHeight] =
    useState(180);

  const [topArcRadius, setTopArcRadius] =
    useState(108);

  const [
    bottomArcRadius,
    setBottomArcRadius,
  ] = useState(108);

  const [doubleBorder, setDoubleBorder] =
    useState(false);

  const [template, setTemplate] =
    useState("custom");

  const [exportFormat, setExportFormat] =
    useState<
        "png" |
        "jpg" |
        "svg" |
        "pdf" |
        "webp"
  >("png");
  const svgRef =
   useRef<SVGSVGElement>(null);

  const displaySize =
    typeof window !== "undefined" && window.innerWidth < 640
        ? Math.min(sealSize, 280)
        : sealSize;
    

  const downloadSeal = async () => {
    if (!svgRef.current) return;

    const serializer =
        new XMLSerializer();

    const svgString =
        serializer.serializeToString(
        svgRef.current
        );

    /* SVG */
    if (exportFormat === "svg") {
        const blob = new Blob(
        [svgString],
        {
            type: "image/svg+xml",
        }
        );

        const url =
        URL.createObjectURL(blob);

        const link =
        document.createElement("a");

        link.href = url;

        link.download =
        "seal.svg";

        link.click();

        URL.revokeObjectURL(url);

        return;
    }

    const svgBlob =
        new Blob([svgString], {
        type: "image/svg+xml",
        });

    const url =
        URL.createObjectURL(svgBlob);

    const img = new Image();

    img.onload = () => {
        const canvas =
        document.createElement(
            "canvas"
        );

        canvas.width = 300;
        canvas.height = 300;

        const ctx =
        canvas.getContext("2d");

        if (!ctx) return;

        /* White background for JPG/PDF */
        if (
        exportFormat === "jpg" ||
        exportFormat === "pdf"
        ) {
        ctx.fillStyle =
            "#FFFFFF";

        ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        );
        }

        ctx.drawImage(
        img,
        0,
        0
        );

        /* PNG */
        if (
        exportFormat === "png"
        ) {
        const link =
            document.createElement(
            "a"
            );

        link.href =
            canvas.toDataURL(
            "image/png"
            );

        link.download =
            "seal.png";

        link.click();
        }

        /* JPG */
        else if (
        exportFormat === "jpg"
        ) {
        const link =
            document.createElement(
            "a"
            );

        link.href =
            canvas.toDataURL(
            "image/jpeg",
            1
            );

        link.download =
            "seal.jpg";

        link.click();
        }

        /* WebP */
        else if (
        exportFormat === "webp"
        ) {
        const link =
            document.createElement(
            "a"
            );

        link.href =
            canvas.toDataURL(
            "image/webp"
            );

        link.download =
            "seal.webp";

        link.click();
        }

        /* PDF */
        else if (
        exportFormat === "pdf"
        ) {
        const pdf =
            new jsPDF({
            orientation:
                "portrait",
            unit: "px",
            format: [
                300,
                300,
            ],
            });

        pdf.addImage(
            canvas.toDataURL(
            "image/png"
            ),
            "PNG",
            0,
            0,
            300,
            300
        );

        pdf.save(
            "seal.pdf"
        );
        }

        URL.revokeObjectURL(
        url
        );
    };

    img.src = url;
};

  const handleLogoUpload = (
    e: React.ChangeEvent<HTMLInputElement>
    ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
        setLogoPreview(
        reader.result as string
        );
    };

    reader.readAsDataURL(file);
  };

  const applyTemplate = (
    selected: string
    ) => {
    setTemplate(selected);

    switch (selected) {
        case "approved":
        setCenterText("APPROVED");
        setTopText("OFFICIAL");
        setBottomText("AUTHORIZED");
        setSealColor("#16A34A");
        setSealShape("circle");
        setDoubleBorder(true);
        setStarSize(22);
        setBorderWidth(3);
        setTopFontSize(18);
        setCenterFontSize(20);
        setBottomFontSize(18);
        break;

        case "paid":
        setCenterText("PAID");
        setTopText("PAYMENT");
        setBottomText("COMPLETED");
        setSealColor("#2563EB");
        setSealShape("circle");
        setDoubleBorder(true);
        setStarSize(22);
        setBorderWidth(3);
        setTopFontSize(18);
        setCenterFontSize(20);
        setBottomFontSize(18);
        break;

        case "received":
        setCenterText("RECEIVED");
        setTopText("DOCUMENT");
        setBottomText("RECORD");
        setSealColor("#EA580C");
        setSealShape("oval");
        setDoubleBorder(true);
        setStarSize(22);
        setBorderWidth(3);
        setTopFontSize(18);
        setCenterFontSize(20);
        setBottomFontSize(18);
        break;

        case "certified":
        setCenterText("CERTIFIED");
        setTopText("QUALITY");
        setBottomText("VERIFIED");
        setSealColor("#7C3AED");
        setSealShape("circle");
        setDoubleBorder(true);
        setStarSize(22);
        setBorderWidth(3);
        setTopFontSize(18);
        setCenterFontSize(20);
        setBottomFontSize(18);
        break;

        case "confidential":
        setCenterText("CONFIDENTIAL");
        setTopText("PRIVATE");
        setBottomText("RESTRICTED");
        setSealColor("#DC2626");
        setSealShape("oval");
        setDoubleBorder(true);
        setStarSize(22);
        setBorderWidth(3);
        setTopFontSize(18);
        setCenterFontSize(20);
        setBottomFontSize(18);
        break;

        case "verified":
        setCenterText("VERIFIED");
        setTopText("AUTHENTIC");
        setBottomText("CONFIRMED");
        setSealColor("#0891B2");
        setSealShape("circle");
        setDoubleBorder(true);
        setStarSize(22);
        setBorderWidth(3);
        setTopFontSize(18);
        setCenterFontSize(20);
        setBottomFontSize(18);
        break;

        default:
        break;
    }
    };

    const templates = [
        {
            id: "approved",
            name: "Approved",
            icon: CheckCircle,
            color: "#16A34A",
        },
        {
            id: "paid",
            name: "Paid",
            icon: BadgeDollarSign,
            color: "#2563EB",
        },
        {
            id: "received",
            name: "Received",
            icon: Inbox,
            color: "#EA580C",
        },
        {
            id: "certified",
            name: "Certified",
            icon: Award,
            color: "#7C3AED",
        },
        {
            id: "confidential",
            name: "Confidential",
            icon: Lock,
            color: "#DC2626",
        },
        {
            id: "verified",
            name: "Verified",
            icon: ShieldCheck,
            color: "#0891B2",
        },
    ];

  return (
    <div className="space-y-8">

      {/* Editor */}
      <section className="bg-white border rounded-2xl p-4 md:p-8 shadow-md">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-8">
          <div className="border border-dotted border-gray-400 p-2">
            <h2 className="text-2xl font-bold mb-6 text-black">
                Seal Details
            </h2>

            <div>
                <label className="block font-medium mb-4 text-black">
                    Ready-made Templates
                </label>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">

                    {/* Custom */}
                    <button
                    type="button"
                    onClick={() => {
                        setTemplate("custom");
                    }}
                    className={`border rounded-xl p2 sm:p-4 text-center transition ${
                        template === "custom"
                        ? "border-black bg-gray-100"
                        : "hover:bg-gray-50"
                    }`}
                    >
                    <div className="text-2xl sm:text-3xl mb-2">
                        ✏️
                    </div>

                    <p className="font-medium text-black">
                        Custom
                    </p>
                    </button>

                    {templates.map((item) => {
                    const Icon = item.icon;

                    return (
                        <button
                        key={item.id}
                        type="button"
                        onClick={() =>
                            applyTemplate(item.id)
                        }
                        className={`border text-black rounded-xl p2 sm:p-4 text-center transition ${
                            template === item.id
                            ? "border-black bg-gray-100"
                            : "hover:bg-gray-50"
                        }`}
                        >
                        <Icon
                            size={26}
                            color={item.color}
                            className="mx-auto mb-2"
                        />

                        <p className="font-medium">
                            {item.name}
                        </p>
                        </button>
                    );
                    })}

                </div>
            </div>

            {/* Seal Oval Shape */}
            <div>
                <label className="block font-medium mb-2 text-black">
                    Seal Shape
                </label>

                <select
                    value={sealShape}
                    onChange={(e) =>
                    setSealShape(
                        e.target.value as
                        | "circle"
                        | "oval"
                    )
                    }
                    className="w-full border rounded-lg px-4 py-3 text-gray-800"
                >
                    <option value="circle">
                    Circular
                    </option>

                    <option value="oval">
                    Oval
                    </option>
                </select>
            </div>

            {sealShape === "oval" && (
            <div className="space-y-4">

                <div>
                <label className="block font-medium mb-2 text-black">
                    Oval Width ({ovalWidth})
                </label>

                <input
                    type="range"
                    min="180"
                    max="280"
                    value={ovalWidth}
                    onChange={(e) =>
                    setOvalWidth(
                        Number(e.target.value)
                    )
                    }
                    className="w-full"
                />
                </div>

                <div>
                <label className="block font-medium mb-2 text-black">
                    Oval Height ({ovalHeight})
                </label>

                <input
                    type="range"
                    min="120"
                    max="220"
                    value={ovalHeight}
                    onChange={(e) =>
                    setOvalHeight(
                        Number(e.target.value)
                    )
                    }
                    className="w-full"
                />
                </div>

            </div>
            )}
            <div>
                <label className="block font-medium mb-2 text-black">
                Organization Name
                </label>

                <input
                type="text"
                value={topText}
                onChange={(e) =>
                    setTopText(
                    e.target.value
                    )
                }
                className="w-full border rounded-lg px-4 py-3 text-gray-800"
                placeholder="Organization Name"
                />
            </div>
            {/* Font Size */}
            <div className="mt-3">
                <label className="block text-sm mb-2 text-black">
                    Font Size: {topFontSize}px
                </label>

                <input
                    type="range"
                    min="12"
                    max="36"
                    value={topFontSize}
                    onChange={(e) =>
                    setTopFontSize(
                        Number(e.target.value)
                    )
                    }
                    className="w-full"
                />
            </div>

            <div>
                <label className="block font-medium mb-2 text-black">
                Center Text
                </label>

                <input
                type="text"
                value={centerText}
                onChange={(e) =>
                    setCenterText(
                    e.target.value
                    )
                }
                className="w-full border rounded-lg px-4 py-3 text-gray-800"
                placeholder="OFFICIAL"
                />
            </div>

            {/* Font Size */}
            <div className="mt-3">
                <label className="block text-sm mb-2 text-gray-800">
                    Font Size: {centerFontSize}px
                </label>

                <input
                    type="range"
                    min="18"
                    max="60"
                    value={centerFontSize}
                    onChange={(e) =>
                    setCenterFontSize(
                        Number(e.target.value)
                    )
                    }
                    className="w-full"
                />
            </div>

            <div>
                <label className="block font-medium mb-2 text-black">
                Bottom Text
                </label>

                <input
                type="text"
                value={bottomText}
                onChange={(e) =>
                    setBottomText(
                    e.target.value
                    )
                }
                className="w-full border rounded-lg px-4 py-3 text-gray-800"
                placeholder="Bottom Text"
                />
            </div>

            {/* Font Size */}
            <div className="mt-3">
                <label className="block text-sm mb-2 text-black">
                    Font Size: {bottomFontSize}px
                </label>

                <input
                    type="range"
                    min="12"
                    max="36"
                    value={bottomFontSize}
                    onChange={(e) =>
                    setBottomFontSize(
                        Number(e.target.value)
                    )
                    }
                    className="w-full"
                />
            </div>
           </div>         
        

            {/* Preview */}
            <div className="border border-gray-400 border-dotted p-3 md:p-4 min-w-0">
                <h2 className="text-2xl font-bold mb-6 text-left text-black">
                    Seal Preview
                </h2>

                <div className="flex justify-center overflow-x-auto">

                <div
                    ref={sealRef}
                    className="
                        bg-white
                        p-2
                        sm:p-4
                        md:p-6
                        max-w-full
                        overflow-hidden
                    "
                >
                    <svg
                        ref={svgRef}
                        viewBox="0 0 300 300"
                        width="300"
                        height="300"
                        className="w-full h-auto max-w-125"
                        style={{
                            maxWidth: `${Math.min(sealSize, 500)}px`,
                        }}
                        >
                        {/* Outer Border */}
                        {sealShape === "circle" ? (
                            <>
                            <circle
                                cx="150"
                                cy="150"
                                r="138"
                                fill="none"
                                stroke={sealColor}
                                strokeWidth={borderWidth}
                            />

                            {doubleBorder && (
                                <circle
                                cx="150"
                                cy="150"
                                r="130"
                                fill="none"
                                stroke={sealColor}
                                strokeWidth={borderWidth}
                                />
                            )}
                            </>
                        ) : (
                            <>
                            <ellipse
                                cx="150"
                                cy="150"
                                rx={ovalWidth / 1.8}
                                ry={ovalHeight / 1.8}
                                fill="none"
                                stroke={sealColor}
                                strokeWidth={borderWidth}
                            />

                            {doubleBorder && (
                                <ellipse
                                cx="150"
                                cy="150"
                                rx={ovalWidth / 1.8 - 8}
                                ry={ovalHeight / 1.8 - 8}
                                fill="none"
                                stroke={sealColor}
                                strokeWidth={borderWidth}
                                />
                            )}
                            </>
                        )}

                        {/* Inner Border */}
                        {sealShape === "circle" ? (
                            <circle
                            cx="150"
                            cy="150"
                            r="90"
                            fill="none"
                            stroke={sealColor}
                            strokeWidth={borderWidth}
                            />
                        ) : (
                            <ellipse
                            cx="150"
                            cy="150"
                            rx={ovalWidth / 2 - 35}
                            ry={ovalHeight / 2 - 30}
                            fill="none"
                            stroke={sealColor}
                            strokeWidth={borderWidth}
                            />
                        )}

                        <defs>
                            {sealShape === "circle" ? (
                            <>
                                <path
                                id="topArc"
                                d={`
                                    M ${150 - topArcRadius},150
                                    A ${topArcRadius},${topArcRadius}
                                    0 0,1
                                    ${150 + topArcRadius},150
                                `}
                                />

                                <path
                                id="bottomArc"
                                d={`
                                    M ${150 - bottomArcRadius},150
                                    A ${bottomArcRadius},${bottomArcRadius}
                                    0 0,0
                                    ${150 + bottomArcRadius},150
                                `}
                                />
                            </>
                            ) : (
                            <>
                                <path
                                id="topArc"
                                d={`
                                    M ${150 - ovalWidth / 2 + 15},150
                                    A ${ovalWidth / 2 - 15},
                                    ${ovalHeight / 2 - 15}
                                    0 0,1
                                    ${150 + ovalWidth / 2 - 15},150
                                `}
                                />

                                <path
                                id="bottomArc"
                                d={`
                                    M ${150 - ovalWidth / 2 + 15},150
                                    A ${ovalWidth / 2 - 15},
                                    ${ovalHeight / 2 - 15}
                                    0 0,0
                                    ${150 + ovalWidth / 2 - 15},150
                                `}
                                />
                            </>
                            )}
                        </defs>

                        {/* Top Text */}
                        <text
                            fill={sealColor}
                            fontFamily={fontFamily}
                            fontSize={topFontSize}
                            fontWeight="bold"
                            letterSpacing="2"
                        >
                            <textPath
                            href="#topArc"
                            startOffset="50%"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            >
                            {topText.toUpperCase()}
                            </textPath>
                        </text>

                        {/* Logo */}
                        {logoPreview && (
                            <image
                            href={logoPreview}
                            x="115"
                            y={sealShape === "oval" ? 90 : 100}
                            width="70"
                            height="70"
                            preserveAspectRatio="xMidYMid meet"
                            />
                        )}

                        {/* Left Star */}
                        <text
                            x={
                            sealShape === "oval"
                                ? 150 - ovalWidth / 2 + 18
                                : 40
                            }
                            y="155"
                            textAnchor="middle"
                            fill={sealColor}
                            fontFamily={fontFamily}
                            fontSize={starSize}
                            fontWeight="bold"
                        >
                            ★
                        </text>

                        {/* Right Star */}
                        <text
                            x={
                            sealShape === "oval"
                                ? 150 + ovalWidth / 2 - 18
                                : 260
                            }
                            y="155"
                            textAnchor="middle"
                            fill={sealColor}
                            fontFamily={fontFamily}
                            fontSize={starSize}
                            fontWeight="bold"
                        >
                            ★
                        </text>

                        {/* Center Text */}
                        <text
                            x="150"
                            y={
                            sealShape === "oval"
                                ? logoPreview
                                ? 190
                                : 160
                                : logoPreview
                                ? 205
                                : 160
                            }
                            textAnchor="middle"
                            fill={sealColor}
                            fontFamily={fontFamily}
                            fontSize={centerFontSize}
                            fontWeight="bold"
                        >
                            {centerText}
                        </text>

                        {/* Bottom Text */}
                        <text
                            fill={sealColor}
                            fontFamily={fontFamily}
                            fontSize={bottomFontSize}
                            fontWeight="bold"
                            letterSpacing="2"
                        >
                            <textPath
                            href="#bottomArc"
                            startOffset="50%"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            >
                            {bottomText.toUpperCase()}
                            </textPath>
                        </text>
                    </svg>

                </div>

                </div>
                
                <div>
                    <label className="block font-medium mb-2 text-black">
                        Download Format
                    </label>

                    <select
                        value={exportFormat}
                        onChange={(e) =>
                        setExportFormat(
                            e.target.value as any
                        )
                        }
                        className="w-full border rounded-lg px-4 py-3 text-gray-800"
                    >
                        <option value="png">
                        PNG (Transparent)
                        </option>

                        <option value="jpg">
                        JPG
                        </option>

                        <option value="svg">
                        SVG (Vector)
                        </option>

                        <option value="pdf">
                        PDF
                        </option>

                        <option value="webp">
                        WebP
                        </option>
                    </select>
                </div>
                <button
                    onClick={downloadSeal}
                    className="mt-8 mb-8 w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800"
                    >
                    Download Seal
                </button>

                <div>
                    <label className="block font-medium mb-2 text-black">
                        Seal Color
                    </label>

                    <div className="flex flex-wrap gap-3 mb-4">

                        {[
                        "#DC2626",
                        "#2563EB",
                        "#000000",
                        "#7C3AED",
                        "#16A34A",
                        "#F97316",
                        "#0891B2",
                        "#92400E",
                        ].map((color) => (
                        <button
                            key={color}
                            onClick={() =>
                            setSealColor(color)
                            }
                            className={`w-10 h-10 rounded-full border-2 ${
                            sealColor === color
                                ? "border-black"
                                : "border-gray-300"
                            }`}
                            style={{
                            backgroundColor: color,
                            }}
                        />
                        ))}

                    </div>

                    <input
                        type="color"
                        value={sealColor}
                        onChange={(e) =>
                        setSealColor(
                            e.target.value
                        )
                        }
                        className="h-12 w-24 cursor-pointer"
                    />

                </div>

                {/* Seal Size */}

                <div>
                    <label className="block font-medium mb-2 text-black">
                        Seal Size ({sealSize}px)
                    </label>

                    <input
                        type="range"
                        min="200"
                        max="500"
                        value={sealSize}
                        onChange={(e) =>
                        setSealSize(
                            Number(e.target.value)
                        )
                        }
                        className="w-full"
                    />
                </div>

                {/* Border Thikness */}

                <div>
                    <label className="block font-medium mb-2 text-black">
                        Border Thickness ({borderWidth}px)
                    </label>

                    <input
                        type="range"
                        min="2"
                        max="12"
                        value={borderWidth}
                        onChange={(e) =>
                        setBorderWidth(
                            Number(e.target.value)
                        )
                        }
                        className="w-full"
                    />
                </div>

                <div className="flex items-center justify-between">
                    <label className="font-bold text-yellow-700">
                        Double Outer Border
                    </label>

                    <input
                        type="checkbox"
                        checked={doubleBorder}
                        onChange={(e) =>
                        setDoubleBorder(
                            e.target.checked
                        )
                        }
                        className="h-5 w-5 cursor-pointer"
                    />
                </div>

                {/* Font Selection */}
                <div>
                    <label className="block font-medium mb-2 text-black">
                        Font
                    </label>

                    <select
                        value={fontFamily}
                        onChange={(e) =>
                        setFontFamily(
                            e.target.value
                        )
                        }
                        className="w-full border rounded-lg px-4 py-3 text-gray-800"
                    >
                        <option>Arial</option>
                        <option>Georgia</option>
                        <option>Times New Roman</option>
                        <option>Verdana</option>
                        <option>Courier New</option>
                    </select>
                </div>

                {/* Logo Upload */}
                <div>
                    <label className="block font-medium mb-2 text-black">
                        Center Logo (Optional)
                    </label>

                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="w-full border rounded-lg px-4 py-3 text-gray-800"
                    />
                </div>
                {/* Star Size */}
                <div>
                    <label className="block font-medium mb-2 text-black">
                        Star Size ({starSize}px)
                    </label>

                    <input
                        type="range"
                        min="10"
                        max="40"
                        value={starSize}
                        onChange={(e) =>
                        setStarSize(
                            Number(e.target.value)
                        )
                        }
                        className="w-full"
                    />
                </div>

            </div>
        </div>
      </section>

      {/* Privacy */}
      <section className="bg-gray-50 border rounded-2xl p-6">

        <h3 className="font-semibold text-black">
          Privacy First
        </h3>

        <p className="text-sm text-gray-600 mt-2">
          Your seal is generated entirely in your browser.
          No data is uploaded to any server.
        </p>

      </section>

    </div>
  );
}