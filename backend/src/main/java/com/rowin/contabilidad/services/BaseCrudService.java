package com.rowin.contabilidad.services;

import com.rowin.contabilidad.entities.BaseEntity;
import com.rowin.contabilidad.exceptions.ResourceNotFoundException;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public abstract class BaseCrudService {
	protected <E extends BaseEntity> E getByIdOrThrow(JpaRepository<E, Long> repository, Long id, String resourceName) {
		Optional<E> found = repository.findById(id);
		if (found.isEmpty()) {
			throw new ResourceNotFoundException(resourceName + " no encontrado: " + id);
		}
		return found.get();
	}

	protected void softDelete(BaseEntity entity) {
		entity.setActive(false);
	}

	protected boolean isActive(BaseEntity entity) {
		return entity.isActive();
	}
}
