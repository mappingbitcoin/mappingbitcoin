"use client"

import React, { MouseEventHandler } from "react";
import { Link } from '@/i18n/navigation';
import { motion } from "framer-motion";

interface ButtonProps {
    onClick?: MouseEventHandler<HTMLButtonElement>;
    href?: string;
    children: React.ReactElement | string;
    buttonType?: ButtonType
}

export enum ButtonType {
    PRIMARY,
    SECONDARY,
    TERTIARY,
    QUATERNARY
}

const baseClasses = "py-3.5 px-7 text-[15px] font-semibold rounded-btn cursor-pointer min-w-[150px] inline-block text-center transition-colors";

const styleClasses: Record<ButtonType, string> = {
    [ButtonType.PRIMARY]: `${baseClasses} bg-accent/10 text-white border-2 border-accent hover:bg-accent/20`,
    [ButtonType.SECONDARY]: `${baseClasses} bg-transparent text-white/80 border-2 border-white/30 hover:border-white/60`,
    [ButtonType.TERTIARY]: `${baseClasses} bg-surface text-white border-2 border-border-light hover:bg-surface-light`,
    [ButtonType.QUATERNARY]: `${baseClasses} bg-surface-light text-accent border-2 border-accent/30 hover:bg-surface`,
};

const Button = ({ href, onClick, children, buttonType = ButtonType.PRIMARY, ...args }: ButtonProps & React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>) => {
    const classes = styleClasses[buttonType];

    const buttonElement = (
        <motion.button
            onClick={onClick}
            className={classes}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            {...args}
        >
            {children}
        </motion.button>
    );

    return href ? (
        <Link href={href}>
            {buttonElement}
        </Link>
    ) : buttonElement;
}

export default Button;

export const ButtonSecondary = ({ ...args }: ButtonProps & React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>) => {
    return <Button buttonType={ButtonType.SECONDARY} {...args} />
}

export const ButtonTertiary = ({ ...args }: ButtonProps & React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>) => {
    return <Button buttonType={ButtonType.TERTIARY} {...args} />
}

export const ButtonQuaternary = ({ ...args }: ButtonProps & React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>) => {
    return <Button buttonType={ButtonType.QUATERNARY} {...args} />
}

export const ButtonLink = ({ children, ...args }: ButtonProps & React.DetailedHTMLProps<React.AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>) => {
    return (
        <motion.a
            className="py-2 px-4 text-sm font-bold bg-accent/10 text-white border-2 border-accent cursor-pointer rounded hover:bg-accent/20 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            {...args}
        >
            {children}
        </motion.a>
    )
}
