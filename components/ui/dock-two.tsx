import * as React from "react"

import { motion } from "framer-motion"

import { cn } from "@/lib/utils"

import { LucideIcon } from "lucide-react"



interface DockProps {

  className?: string

  items: {

    icon: LucideIcon

    label: string

    onClick?: () => void

    onDragStart?: (e: React.DragEvent) => void

    draggable?: boolean

  }[]

  compact?: boolean

  variant?: 'default' | 'compact'

  prefix?: React.ReactNode

  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right'

}



interface DockIconButtonProps {

  icon: LucideIcon

  label: string

  onClick?: () => void

  className?: string

  onDragStart?: (e: React.DragEvent) => void

  draggable?: boolean

  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right'

}



const floatingAnimation = {

  initial: { y: 0 },

  animate: {

    y: [-2, 2, -2],

    transition: {

      duration: 4,

      repeat: Infinity,

      ease: "easeInOut" as const

    }

  }

}



const DockIconButton = React.forwardRef<HTMLButtonElement, DockIconButtonProps>(

  ({ icon: Icon, label, onClick, className, onDragStart, draggable, tooltipPosition = 'top' }, ref) => {

    return (

      <motion.div

        whileHover={{ scale: 1.1, y: -2 }}

        whileTap={{ scale: 0.95 }}

        className="inline-block"

      >

        <button

          ref={ref}

          onClick={onClick}

          draggable={draggable}

          onDragStart={onDragStart}

          className={cn(

            "relative group p-3 rounded-lg",

            "hover:bg-secondary transition-colors",

            draggable && "cursor-grab active:cursor-grabbing",

            className

          )}

        >

          <Icon className="w-5 h-5 text-foreground" />

          <span className={cn(

            "absolute px-2 py-1 rounded text-xs",

            "bg-popover text-popover-foreground",

            "opacity-0 group-hover:opacity-100",

            "transition-opacity whitespace-nowrap pointer-events-none",

            tooltipPosition === 'top' && "left-1/2 -translate-x-1/2 -top-8",
            tooltipPosition === 'bottom' && "left-1/2 -translate-x-1/2 -bottom-8",
            tooltipPosition === 'left' && "right-full mr-2 top-1/2 -translate-y-1/2",
            tooltipPosition === 'right' && "left-full ml-2 top-1/2 -translate-y-1/2"

          )}>

            {label}

          </span>

        </button>

      </motion.div>

    )

  }

)

DockIconButton.displayName = "DockIconButton"



const Dock = React.forwardRef<HTMLDivElement, DockProps>(

  ({ items, className, compact, variant = 'default', prefix, tooltipPosition = 'top' }, ref) => {

    const isCompact = compact || variant === 'compact';

    if (isCompact) {

      return (

        <motion.div

          ref={ref}

          initial="initial"

          animate="animate"

          variants={floatingAnimation}

          className={cn(

            "flex items-center gap-1 p-2 rounded-2xl",

            "backdrop-blur-lg border shadow-lg",

            "bg-background/90 border-border",

            "hover:shadow-xl transition-shadow duration-300",

            className

          )}

        >

          {prefix && (
            <div className="flex items-center gap-2 mr-1">
              {prefix}
            </div>
          )}

          {items.map((item) => (

            <DockIconButton 
              key={item.label} 
              icon={item.icon}
              label={item.label}
              onClick={item.onClick}
              onDragStart={item.onDragStart}
              draggable={item.draggable}
              tooltipPosition={tooltipPosition}
            />

          ))}

        </motion.div>

      )

    }

    return (

      <div ref={ref} className={cn("w-full h-64 flex items-center justify-center p-2", className)}>

        <div className="w-full max-w-4xl h-64 rounded-2xl flex items-center justify-center relative">

          <motion.div

            initial="initial"

            animate="animate"

            variants={floatingAnimation}

            className={cn(

              "flex items-center gap-1 p-2 rounded-2xl",

              "backdrop-blur-lg border shadow-lg",

              "bg-background/90 border-border",

              "hover:shadow-xl transition-shadow duration-300"

            )}

          >

            {items.map((item) => (

              <DockIconButton 
                key={item.label} 
                icon={item.icon}
                label={item.label}
                onClick={item.onClick}
                onDragStart={item.onDragStart}
                draggable={item.draggable}
                tooltipPosition={tooltipPosition}
              />

            ))}

          </motion.div>

        </div>

      </div>

    )

  }

)

Dock.displayName = "Dock"



export { Dock }

