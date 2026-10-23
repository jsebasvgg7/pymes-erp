package com.rowin.contabilidad.entities;

import java.util.Collections;
import java.util.EnumSet;
import java.util.Set;

public enum FacturaEstado {
       BORRADOR,
       EMITIDA,
       PAGADA,
       ANULADA;

       public static final Set<FacturaEstado> VENTAS_VALIDAS =
               Collections.unmodifiableSet(EnumSet.of(EMITIDA, PAGADA));

       public boolean cuentaComoVenta() {
               return VENTAS_VALIDAS.contains(this);
       }
}