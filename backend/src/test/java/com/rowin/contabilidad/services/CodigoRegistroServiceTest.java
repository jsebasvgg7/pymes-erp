package com.rowin.contabilidad.services;

import com.rowin.contabilidad.exceptions.CodigoRegistroInvalidoException;
import com.rowin.contabilidad.repositories.CodigoRegistroRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CodigoRegistroServiceTest {

    private static final String HUELLA_ABC = "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";

    @Mock
    private CodigoRegistroRepository codigoRegistroRepository;

    @InjectMocks
    private CodigoRegistroService servicio;

    @Test
    void consumeElCodigoPorSuHuellaSha256Hexadecimal() {
        when(codigoRegistroRepository.consumir(HUELLA_ABC)).thenReturn(1);

        assertEquals(HUELLA_ABC, servicio.consumir("abc"));
        verify(codigoRegistroRepository).consumir(HUELLA_ABC);
    }

    @Test
    void ignoraEspaciosAlrededorDelCodigo() {
        when(codigoRegistroRepository.consumir(HUELLA_ABC)).thenReturn(1);

        assertEquals(HUELLA_ABC, servicio.consumir("  abc \n"));
    }

    @Test
    void codigoInexistenteVencidoOUsadoRespondenIgual() {
        when(codigoRegistroRepository.consumir(HUELLA_ABC)).thenReturn(0);

        CodigoRegistroInvalidoException exception = assertThrows(
                CodigoRegistroInvalidoException.class, () -> servicio.consumir("abc"));

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatusCode());
        assertEquals("Código de acceso inválido", exception.getReason());
    }

    @Test
    void codigoVacioONuloSeRechazaSinConsultarLaBase() {
        assertThrows(CodigoRegistroInvalidoException.class, () -> servicio.consumir(null));
        assertThrows(CodigoRegistroInvalidoException.class, () -> servicio.consumir("   "));

        verifyNoInteractions(codigoRegistroRepository);
    }

    @Test
    void elCodigoEnClaroNuncaLlegaAlRepositorio() {
        when(codigoRegistroRepository.consumir(HUELLA_ABC)).thenReturn(1);

        servicio.consumir("abc");

        verify(codigoRegistroRepository, never()).consumir("abc");
        verify(codigoRegistroRepository, never()).asignarEmpresa(anyString(), any());
    }

    @Test
    void asignaLaEmpresaCreadaAlCodigoConsumido() {
        servicio.asignarEmpresa(HUELLA_ABC, 9L);

        verify(codigoRegistroRepository).asignarEmpresa(HUELLA_ABC, 9L);
    }
}
